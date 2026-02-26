import prisma from "../lib/prisma.js";

async function MonthlyIncome(from, to) {
	const adjustedTo =
		to.slice(5, 10) === "02-31" ? to.slice(0, 5) + "02-28" : to;

	const result = await prisma.payments.groupBy({
		by: ["paid_at"],
		_sum: { amount: true },
		where: {
			status: "ACTIVE",
			paid_at: { gte: new Date(from), lte: new Date(adjustedTo) },
		},
		orderBy: { paid_at: "asc" },
	});

	return result.map((r) => ({
		month: r.paid_at,
		total_income: Number(r._sum.amount ?? 0),
	}));
}

async function TopDebtors(month) {
	const startOfMonth = new Date(month);
	const endOfMonth = new Date(startOfMonth);
	endOfMonth.setMonth(startOfMonth.getMonth() + 1);

	const students = await prisma.students.findMany({
		where: { status: "ACTIVE" },
		include: {
			enrollments: { include: { groups: true } },
			payments: { where: { paid_at: { gte: startOfMonth, lt: endOfMonth } } },
		},
	});

	const debts = students
		.map((s) => {
			const should_pay = s.enrollments.reduce(
				(sum, e) => sum + Number(e.groups?.price ?? 0),
				0,
			);
			const paid = s.payments.reduce(
				(sum, p) => sum + Number(p.amount ?? 0),
				0,
			);
			const debt = should_pay - paid;
			return debt > 0
				? { student_id: s.id, full_name: s.full_name, should_pay, paid, debt }
				: null;
		})
		.filter(Boolean);

	return debts.sort((a, b) => b.debt - a.debt).slice(0, 10);
}

async function TodayLessons() {
	const todayDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
		new Date().getDay()
	];
	const now = new Date();

	const lessons = await prisma.groups.findMany({
		where: { status: "ACTIVE", lesson_days: { has: todayDay } },
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

async function AbsentStudents() {
	const todayDay = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
		new Date().getDay()
	];
	const now = new Date();

	// fetch all active groups today
	const groups = await prisma.groups.findMany({
		where: { status: "ACTIVE", lesson_days: { has: todayDay } },
		include: { enrollments: { include: { students: true } } },
	});

	const absent = [];

	for (const g of groups) {
		for (const e of g.enrollments) {
			// fetch attendance for this student/group today
			const att = await prisma.attendance.findFirst({
				where: {
					group_id: g.id,
					student_id: e.students.id,
					lesson_date: new Date(),
				},
			});

			const lessonTime = g.lesson_time?.split(" - ")[0] ?? "00:00";

			if (
				(!att || att.status === false) &&
				new Date(`1970-01-01T${lessonTime}`) <= now
			) {
				absent.push({
					group_name: g.name,
					student_id: e.students.id,
					full_name: e.students.full_name,
					phone: e.students.phone,
					parents_name: e.students.parents_name,
					parents_phone: e.students.parents_phone,
				});
			}
		}
	}

	return absent.sort(
		(a, b) =>
			a.group_name.localeCompare(b.group_name) ||
			a.full_name.localeCompare(b.full_name),
	);
}
export default { AbsentStudents, MonthlyIncome, TodayLessons, TopDebtors };