import prisma from "../lib/prisma.js";
import { parseLessonTime } from "../utils/time.js";
import { DateTime } from "luxon";
async function MonthlyIncome(tenant_id) {
	const now = new Date();
	const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthEnd = new Date(
		now.getFullYear(),
		now.getMonth(),
		0,
		23,
		59,
		59,
	);

	// Bu oy tushgan pullar
	const currentTotal = await prisma.payments.aggregate({
		_sum: { amount: true },
		where: {
			tenant_id: tenant_id,
			status: "ACTIVE",
			paid_at: { gte: currentMonthStart },
		},
	});

	// O'tgan oy tushgan pullar
	const lastTotal = await prisma.payments.aggregate({
		_sum: { amount: true },
		where: {
			tenant_id: tenant_id,
			status: "ACTIVE",
			paid_at: { gte: lastMonthStart, lte: lastMonthEnd },
		},
	});

	const current = Number(currentTotal._sum.amount || 0);
	const last = Number(lastTotal._sum.amount || 0);

	let percentageChange = 0;
	if (last > 0) {
		percentageChange = ((current - last) / last) * 100;
	} else if (current > 0) {
		percentageChange = 100;
	}

	return {
		current_month_income: current,
		last_month_income: last,
		percentage: parseFloat(percentageChange.toFixed(2)),
		status: percentageChange >= 0 ? "up" : "down",
	};
}

async function TopDebtors(tenant_id) {
	try {
		const debtors = await prisma.students.findMany({
			where: {
				tenant_id: tenant_id,
				status: "ACTIVE",
				balance: { lt: 0 }, // Faqat balansi minusdagilar
			},
			include: {
				enrollments: {
					where: { status: "ACTIVE" },
					include: {
						groups: true, // Kurs narxini olish uchun
					},
				},
				payments: {
					where: { status: "ACTIVE" },
					orderBy: { paid_at: "desc" },
					 // Oxirgi to'lovni olish uchun
				},
			},
			orderBy: {
				balance: "asc", // Eng katta qarzdorlar birinchi
			},
		});

		return debtors.map((student) => {
			const totalCoursePrice = student.enrollments.reduce(
				(sum, en) => sum + Number(en.groups.price || 0),
				0,
			);
         const total_paid = student.payments.reduce(
            (sum, p) => sum + Number(p.amount || 0),
            0,
         );
			// 2. Jami to'lagan summasini topish (balance va kurs narxidan kelib chiqib)
			// Balans = Jami To'lov - Jami Kurs Narxi -> Jami To'lov = Balans + Jami Kurs Narxi
			// Lekin bizda balans manfiy. Shuning uchun:
			const currentBalance = Number(student.balance);
         const debt_amount = total_paid - totalCoursePrice;
			const lastPayment = student.payments[0];

			return {
				student_id: student.id,
				full_name: student.full_name,
				group_name:
					student.enrollments.map((en) => en.groups.name).join(", ") ||
					"Guruhsiz",
				course_price: totalCoursePrice,
				total_paid: total_paid, 
				debt_amount: Math.abs(debt_amount),
				status: student.status,
				last_payment_date: lastPayment
					? lastPayment.created_at
					: "To'lov qilinmagan",
				phone: student.phone,
			};
		});
	} catch (error) {
		console.error("Detailed Debtors Error:", error);
		throw error;
	}
}

async function TodayLessons(tenant_id) {
	// 1. O'zbekiston vaqti bo'yicha bugungi kunni aniqlash
	const todayDay = new Intl.DateTimeFormat("en-US", {
		weekday: "short",
		timeZone: "Asia/Tashkent",
	}).format(new Date());

	const lessons = await prisma.groups.findMany({
		where: {
			tenant_id: tenant_id,
			status: "ACTIVE",
			lesson_days: { has: todayDay },
		},
		include: {
			teachers: { select: { full_name: true } },
			_count: {
				select: { enrollments: true },
			},
		},
		orderBy: { lesson_time: "asc" },
	});

	return lessons.map((g) => ({
		id: g.id,
		group_name: g.name,
		lesson_time: g.lesson_time,
		lesson_days: g.lesson_days,
		course_type: g.course_type,
		teacher_name: g.teachers?.full_name ?? "O'qituvchi belgilanmagan",
		students_count: g._count.enrollments,
	}));
}

async function AbsentStudents(tenant_id) {
	const tz = "Asia/Tashkent";
	const nowTz = DateTime.now().setZone(tz);

	const todayDay = nowTz.toFormat("ccc");
	const nowMinutes = nowTz.hour * 60 + nowTz.minute;

	const startOfToday = nowTz.startOf("day").toJSDate();
	const endOfToday = nowTz.endOf("day").toJSDate();

	const groups = await prisma.groups.findMany({
		where: {
			tenant_id: tenant_id,
			status: "ACTIVE",
			lesson_days: { has: todayDay },
		},
		include: {
			enrollments: {
				where: { students: { status: "ACTIVE" } },
				include: { students: true },
			},
		},
	});

	const attendanceRecords = await prisma.attendance.findMany({
		where: {
			tenant_id: tenant_id,
			lesson_date: { gte: startOfToday, lte: endOfToday },
		},
	});

	const attMap = new Map(
		attendanceRecords.map((att) => [`${att.group_id}-${att.student_id}`, att]),
	);

	const absent = [];
	const seenStudents = new Set();

	for (const g of groups) {
		try {
			const { start: lessonStartMinutes } = parseLessonTime(g.lesson_time);

			if (lessonStartMinutes <= nowMinutes) {
				for (const e of g.enrollments) {
					const student = e.students;
					if (!student) continue;

					const uniqueKey = `${g.id}-${student.id}`;
					if (seenStudents.has(uniqueKey)) continue;
					seenStudents.add(uniqueKey);

					const att = attMap.get(uniqueKey);

					if (!att || att.status === false) {
						absent.push({
							group_name: g.name,
							group_id: g.id,
							student_id: student.id,
							full_name: student.full_name,
							phone: student.phone,
							parents_name: student.parents_name,
							parents_phone: student.parents_phone,
						});
					}
				}
			}
		} catch (err) {
			console.error(`⚠️ Error in group ${g.id}:`, err.message);
			continue;
		}
	}

	return absent.sort(
		(a, b) =>
			a.group_name.localeCompare(b.group_name) ||
			a.full_name.localeCompare(b.full_name),
	);
}

async function GetDebtAnalysis(tenant_id) {
	try {
		// 1. Hozirgi barcha qarzdorlarni olish
		const debtors = await prisma.students.findMany({
			where: {
				tenant_id: tenant_id,
				status: "ACTIVE",
				balance: { lt: 0 }, // balance < 0
			},
			select: {
				balance: true,
				last_billed_at: true,
			},
		});

		// 2. Summani hisoblashda Decimal'ni xavfsiz Number'ga o'tkazamiz
		const totalAmount = debtors.reduce((sum, s) => {
			const b = s.balance ? Number(s.balance) : 0;
			return sum + Math.abs(b);
		}, 0);

		// 3. O'tgan oygi qarzdorlar sonini hisoblash
		const now = new Date();
		const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		const oldDebtorsCount = await prisma.students.count({
			where: {
				tenant_id: tenant_id,
				status: "ACTIVE",
				balance: { lt: 0 },
				// last_billed_at shu oydan oldin bo'lsa, demak u eski qarzdor
				OR: [
					{ last_billed_at: { lt: currentMonthStart } },
					{ last_billed_at: null },
				],
			},
		});

		const currentCount = debtors.length;

		// 4. Farqni hisoblash
		let diffPercentage = 0;
		if (oldDebtorsCount > 0) {
			diffPercentage =
				((currentCount - oldDebtorsCount) / oldDebtorsCount) * 100;
		} else if (currentCount > 0) {
			diffPercentage = 100;
		}

		return {
			debtorCount: currentCount,
			totalDebtAmount: totalAmount,
			diffPercentage: diffPercentage,
			trend: currentCount >= oldDebtorsCount ? "up" : "down",
		};
	} catch (error) {
		console.error("Debt Analysis Error:", error);
		return {
			debtorCount: 0,
			totalDebtAmount: 0,
			diffPercentage: 0,
			trend: "stable",
		};
	}
}

async function GetDashboardStats(tenant_id) {
	const now = new Date();

	// 1. Vaqt chegaralarini belgilash
	const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

	// 2. Ma'lumotlarni parallel ravishda yig'ish
	const [currentStudents, lastMonthStudents, currentGroups, lastMonthGroups] =
		await Promise.all([
			// Jami faol talabalar (hozirgi)
			prisma.students.count({ where: { tenant_id, status: "ACTIVE" } }),
			prisma.students.count({
				where: {
					tenant_id,
					created_at: { lt: thisMonthStart },
					status: "ACTIVE",
				},
			}),
			// Jami faol guruhlar (hozirgi)
			prisma.groups.count({ where: { tenant_id, status: "ACTIVE" } }),
			// O'tgan oy oxirigacha bo'lgan guruhlar
			prisma.groups.count({
				where: {
					tenant_id,
					created_at: { lt: thisMonthStart },
					status: "ACTIVE",
				},
			}),
		]);

	// 3. Foizlarni hisoblash funksiyasi
	const calculateGrowth = (current, previous) => {
		if (previous === 0) return current > 0 ? 100 : 0;
		return (((current - previous) / previous) * 100).toFixed(0);
	};

	return {
		students: {
			total: currentStudents,
			growth: calculateGrowth(currentStudents, lastMonthStudents),
			status: currentStudents >= lastMonthStudents ? "up" : "down",
		},
		groups: {
			total: currentGroups,
			growth: calculateGrowth(currentGroups, lastMonthGroups),
			status: currentGroups >= lastMonthGroups ? "up" : "down",
		},
	};
}

export default {
	AbsentStudents,
	MonthlyIncome,
	TodayLessons,
	TopDebtors,
	GetDebtAnalysis,
	GetDashboardStats,
};
