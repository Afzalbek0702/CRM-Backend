import prisma from "../lib/prisma.js";
import { parseLessonTime } from "../utils/time.js";

async function MonthlyIncome(from, to, tenant_id) {
	const adjustedTo =
		to.slice(5, 10) === "02-31" ? to.slice(0, 5) + "02-28" : to;

	const result = await prisma.payments.groupBy({
		by: ["paid_at"],
		_sum: { amount: true },
		where: {
			status: "ACTIVE",
			tenant_id: tenant_id,
			paid_at: {
				gte: new Date(`${from}T00:00:00Z`),
				lte: new Date(`${adjustedTo}T23:59:59Z`),
			},
		},
		orderBy: { paid_at: "asc" },
	});

	return result.map((r) => ({
		month: r.paid_at,
		total_income: Number(r._sum.amount ?? 0),
	}));
}

async function TopDebtors(month, tenant_id) {
	const startOfMonth = new Date(month);
	const endOfMonth = new Date(startOfMonth);
	endOfMonth.setMonth(endOfMonth.getMonth() + 1);

	const students = await prisma.students.findMany({
		where: { status: "ACTIVE", tenant_id: tenant_id },
		include: {
			enrollments: {
				where: { status: "ACTIVE" },
				include: { groups: true },
			},
			payments: {
				where: {
					paid_at: {
						gte: startOfMonth,
						lt: endOfMonth,
					},
				},
			},
		},
	});

	const debts = students
		.map((s) => {
			const should_pay = s.enrollments.reduce(
				(sum, e) => sum + Number(e.groups?.price || 0),
				0,
			);

			const paid = s.payments.reduce(
				(sum, p) => sum + Number(p.amount || 0),
				0,
			);

			const debt = should_pay - paid;

			if (debt <= 0) return null;

			return {
				student_id: s.id,
				full_name: s.full_name,
				should_pay,
				paid,
				debt,
			};
		})
		.filter(Boolean)
		.sort((a, b) => b.debt - a.debt)
		.slice(0, 10);

	return debts;
}

async function TodayLessons(tenant_id) {
	const todayDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
		new Date().getDay()
	];

	const lessons = await prisma.groups.findMany({
		where: {
			tenant_id: tenant_id,
			status: "ACTIVE",
			lesson_days: { has: todayDay },
		},
		include: {
			teachers: { select: { full_name: true } },
			enrollments: { select: { student_id: true } },
		},
		orderBy: { lesson_time: "asc" },
	});

	return lessons.map((g) => ({
		id: g.id,
		group_name: g.name,
		lesson_time: g.lesson_time,
		lesson_days: g.lesson_days,
		course_type: g.course_type,
		teacher_name: g.teachers?.full_name ?? null,
		students_count: g.enrollments.length,
	}));
}

async function AbsentStudents(tenant_id) {
	const todayDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
		new Date().getDay()
	];
	const now = new Date();
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

	const nowMinutes = now.getHours() * 60 + now.getMinutes();

	const groups = await prisma.groups.findMany({
		where: {
			tenant_id: tenant_id,
			status: "ACTIVE",
			lesson_days: { has: todayDay },
		},
		include: {
			enrollments: {
				where: {
					students: { status: "ACTIVE" },
				},
				include: { students: true },
			},
		},
	});

	const attendanceRecords = await prisma.attendance.findMany({
		where: {
			lesson_date: { gte: today, lt: tomorrow },
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
			console.warn(`⚠️ Skipping group ${g.id}:`, err.message);
			continue;
		}
	}

	return absent.sort(
		(a, b) =>
			a.group_name.localeCompare(b.group_name) ||
			a.full_name.localeCompare(b.full_name),
	);
}

export default { AbsentStudents, MonthlyIncome, TodayLessons, TopDebtors };
