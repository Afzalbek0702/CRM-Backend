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

	return lessons.map(g => ({
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
				where: { status: "ACTIVE", students: { status: "ACTIVE" } },
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
		attendanceRecords.map(att => [`${att.group_id}-${att.student_id}`, att]),
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
		// 1. Barcha aktiv o'quvchilarni barcha kerakli bog'liqliklari bilan olish
		const students = await prisma.students.findMany({
			where: {
				tenant_id: tenant_id,
				status: "ACTIVE",
			},
			include: {
				enrollments: {
					where: { status: "ACTIVE" },
					include: { groups: true },
				},
				payments: {
					where: { status: "ACTIVE" },
				},
			},
		});

		const now = new Date();
		const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		let currentDebtorCount = 0;
		let oldDebtorsCount = 0;
		let totalDebtAmount = 0;

		students.forEach(student => {
			const currentBalance = Number(student.balance || 0);

			// Guruhlar narxi yig'indisi
			const totalCoursePrice = student.enrollments.reduce(
				(sum, en) => sum + Number(en.groups?.price || 0),
				0,
			);

			// Jami to'lovlar yig'indisi
			const totalPaid = student.payments.reduce(
				(sum, p) => sum + Number(p.amount || 0),
				0,
			);

			// QARZDORLIK MANTIQI
			const debtFromBalance = currentBalance < 0 ? Math.abs(currentBalance) : 0;
			const debtFromPrice =
				totalPaid < totalCoursePrice ? totalCoursePrice - totalPaid : 0;

			// Ikkala usuldan eng kattasini qarz deb olamiz
			const finalDebt = Math.max(debtFromBalance, debtFromPrice);

			if (finalDebt > 0) {
				currentDebtorCount++;
				totalDebtAmount += finalDebt;

				// ESKI QARZDORLIKNI ANIQLASH
				// Agar oxirgi hisob-kitob (billing) o'tgan oyda bo'lgan bo'lsa
				const isOld =
					!student.last_billed_at ||
					new Date(student.last_billed_at) < currentMonthStart;
				if (isOld) {
					oldDebtorsCount++;
				}
			}
		});

		// 2. Farqni (Percentage) hisoblash
		let diffPercentage = 0;
		if (oldDebtorsCount > 0) {
			diffPercentage =
				((currentDebtorCount - oldDebtorsCount) / oldDebtorsCount) * 100;
		} else if (currentDebtorCount > 0) {
			diffPercentage = 100;
		}

		return {
			debtorCount: currentDebtorCount,
			totalDebtAmount: totalDebtAmount,
			diffPercentage: Number(diffPercentage.toFixed(1)), // 12.5% ko'rinishida
			trend: currentDebtorCount >= oldDebtorsCount ? "up" : "down",
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
	GetDebtAnalysis,
	GetDashboardStats,
};
