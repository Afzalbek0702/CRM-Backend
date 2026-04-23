import dayjs from "dayjs";
import prisma from "../lib/prisma.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
dayjs.extend(customParseFormat);

import {
	calculateProratedFee,
	formatDateForDB,
	getMonthRange,
} from "../utils/date.js";

export async function get(tenant_id) {
	return await prisma.enrollments.findMany({
		where: {
			tenant_id: tenant_id,
			status: "ACTIVE",
		},
	});
}
export async function create(
	studentId,
	groupId,
	tenantId,
	joinDate = new Date(),
) {
	return await prisma.$transaction(async tx => {
		// 1. Group ma'lumotlarini (lesson_days bilan) olish
		const group = await tx.groups.findUnique({
			where: { id: groupId, tenant_id: tenantId, status: "ACTIVE" },
		});
		if (!group) throw new Error("Group topilmadi yoki faol emas");

		// 2. Allaqachon qo'shilmaganligini tekshirish
		const exists = await tx.enrollments.findFirst({
			where: { student_id: studentId, group_id: groupId, status: "ACTIVE" },
		});
		if (exists) throw new Error("O'quvchi allaqachon ushbu guruhda");

		// 3. Sana va dars kuniga ko'ra aniq proratsiya
		const { end: monthEnd, nextStart } = getMonthRange(joinDate);

		// --- YANGI MANTIQ ---
		const proratedFee = calculateExactProratedFee(
			group.price,
			group.lesson_days, // Masalan: ['MON', 'WED', 'FRI']
			joinDate,
			monthEnd,
			group.lesson_time,
		);
		console.log(proratedFee);
		console.log(group.lesson_days);

		// --------------------

		const nextBillingDateString = formatDateForDB(nextStart);

		// 4. Enrollment yaratish
		await tx.enrollments.create({
			data: {
				student_id: studentId,
				group_id: groupId,
				tenant_id: tenantId,
				next_billing_date: nextBillingDateString,
			},
		});

		// 5. Talaba balansidan yechish
		if (proratedFee > 0) {
			await tx.students.update({
				where: { id: studentId, tenant_id: tenantId },
				data: {
					balance: { decrement: proratedFee },
					last_billed_at: new Date(),
				},
			});
		}

		return {
			success: true,
			chargedAmount: proratedFee,
			remainingLessons: "Dars kunlariga qarab hisoblandi",
			nextBillingDate: nextBillingDateString,
		};
	});
}

function calculateExactProratedFee(
	fullPrice,
	lessonDays,
	joinDate,
	monthEnd,
	lessonTimeString,
) {
	const tz = "Asia/Tashkent";
	const now = dayjs().tz(tz);
	const start = dayjs(joinDate).tz(tz).startOf("day");
	const end = dayjs(monthEnd).tz(tz).endOf("day");

	// 1. Dars boshlanish vaqtini ajratib olish (14:00-15:30 -> 14:00)
	const endTimeStr = lessonTimeString.split("-")[1];
	const [hours, minutes] = endTimeStr.split(":").map(Number);

	const daysMapping = {
		SUN: 0,
		MON: 1,
		TUE: 2,
		WED: 3,
		THU: 4,
		FRI: 5,
		SAT: 6,
	};
	const activeLessonDays = lessonDays.map(
		day => daysMapping[day.toUpperCase()],
	);

	// Standart: Oylik to'lovni 12 ta darsga bo'lish
	const pricePerLesson = fullPrice / 12;

	let remainingLessonsCount = 0;
	let tempDate = start;

	// 2. Sanalarni aylanib chiqish
	while (tempDate.isBefore(end) || tempDate.isSame(end, "day")) {
		if (activeLessonDays.includes(tempDate.day())) {
			if (tempDate.isSame(now, "day")) {
				// Bugungi dars vaqtini yasaymiz
				const lessonMoment = tempDate.hour(hours).minute(minutes).second(0);

				// Agar hozirgi vaqt dars tugashidan oldin bo'lsa, bugunni sanaymiz
				// (Ya'ni darsga ulguradi)
				if (now.isBefore(lessonMoment)) {
					remainingLessonsCount++;
				}
			} else {
				// Kelajakdagi dars kunlarini sanaymiz
				remainingLessonsCount++;
			}
		}
		tempDate = tempDate.add(1, "day");
	}

	console.log(`Dars tugash vaqti: ${endTimeStr}`);
	console.log(`Aniq qolgan darslar soni: ${remainingLessonsCount}`);

	const exactTotal = remainingLessonsCount * pricePerLesson;

	// 1000 ga yuqoriga yaxlitlash
	return Math.ceil(exactTotal / 1000) * 1000;
}