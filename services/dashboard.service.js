import prisma from "../lib/prisma.js";
import { parseLessonTime } from "../utils/time.js";
import { DateTime } from "luxon";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

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
	const tz = "Asia/Tashkent";
	const now = dayjs().tz(tz);

	// Bugun dars kuni ekanligini tekshirish (masalan: "Mon", "Tue")
	const todayDay = now.format("ddd"); // Masalan: "Thu"

	try {
		const lessons = await prisma.$queryRaw`
            SELECT 
                g.id,
                g.name as group_name,
                g.lesson_time,
                g.lesson_days,
                g.course_type,
                COALESCE(t.full_name, 'O''qituvchi belgilanmagan') as teacher_name,
                -- Guruhdagi aktiv o'quvchilar sonini sanash
                (
                    SELECT COUNT(*)::INT 
                    FROM "enrollments" e 
                    WHERE e.group_id = g.id AND e.status = 'ACTIVE'
                ) as students_count
            FROM "groups" g
            LEFT JOIN "teachers" t ON g.teacher_id = t.id
            WHERE 
                g.tenant_id = ${tenant_id} AND
                g.status = 'ACTIVE' AND
                ${todayDay} = ANY(g.lesson_days)
            ORDER BY g.lesson_time ASC;
        `;

		return lessons;
	} catch (error) {
		console.error("TodayLessons SQL Error:", error);
		return [];
	}
}
// with prisma
// async function AbsentStudents(tenant_id) {
// 	const tz = "Asia/Tashkent";
// 	const now = dayjs().tz(tz);

// 	// Bugun dars kuni ekanligini tekshirish uchun (MON, TUE, ...)
// 	const todayDay = now.format("ddd").toUpperCase(); // Prisma 'has' sharti uchun
// 	const nowMinutes = now.hour() * 60 + now.minute();

// 	// Bugungi kun boshlanishi va tugashi (UTC formatda bazaga yuborish uchun)
// 	const startOfToday = now.startOf("day").toDate();
// 	const endOfToday = now.endOf("day").toDate();

// 	try {
// 		// 1. Bugun dars kuni bor bo'lgan va vaqti kelgan (yoki o'tgan) guruhlarni topamiz
// 		const groups = await prisma.groups.findMany({
// 			where: {
// 				tenant_id: tenant_id,
// 				status: "ACTIVE",
// 				lesson_days: { has: todayDay },
// 			},
// 			include: {
// 				enrollments: {
// 					where: {
// 						status: "ACTIVE",
// 						students: { status: "ACTIVE" },
// 					},
// 					include: { students: true },
// 				},
// 			},
// 		});

// 		// 2. Bugungi barcha davomatlarni (attendance) bittada olamiz
// 		const attendanceRecords = await prisma.attendance.findMany({
// 			where: {
// 				tenant_id: tenant_id,
// 				lesson_date: { gte: startOfToday, lte: endOfToday },
// 			},
// 		});

// 		// Tezkor qidirish uchun Map yaratamiz
// 		const attMap = new Map(
// 			attendanceRecords.map(att => [`${att.group_id}-${att.student_id}`, att]),
// 		);

// 		const absent = [];

// 		for (const g of groups) {
// 			try {
// 				const { start: lessonStartMinutes } = parseLessonTime(g.lesson_time);

// 				// Agar dars vaqti kelgan bo'lsa
// 				if (lessonStartMinutes <= nowMinutes) {
// 					for (const e of g.enrollments) {
// 						const student = e.students;
// 						if (!student) continue;

// 						const uniqueKey = `${g.id}-${student.id}`;
// 						const att = attMap.get(uniqueKey);

// 						// Agar davomat qilinmagan bo'lsa (att yo'q) yoki davomatda 'yo'q' (false) deyilgan bo'lsa
// 						if (!att || att.status === false) {
// 							absent.push({
// 								group_name: g.name,
// 								group_id: g.id,
// 								student_id: student.id,
// 								full_name: student.full_name,
// 								phone: student.phone,
// 								parents_name: student.parents_name,
// 								parents_phone: student.parents_phone,
// 								lesson_time: g.lesson_time, // Dashboard uchun qulay
// 							});
// 						}
// 					}
// 				}
// 			} catch (err) {
// 				console.error(`⚠️ Error processing group ${g.id}:`, err.message);
// 			}
// 		}

// 		// Alfavit bo'yicha tartiblash
// 		return absent.sort(
// 			(a, b) =>
// 				a.group_name.localeCompare(b.group_name) ||
// 				a.full_name.localeCompare(b.full_name),
// 		);
// 	} catch (error) {
// 		console.error("AbsentStudents Error:", error);
// 		throw error;
// 	}
// }

// async function AbsentStudents(tenant_id) {
// 	const tz = "Asia/Tashkent";
// 	const now = dayjs().tz(tz);

// 	const todayDay = now.format("ddd").toUpperCase(); // "MON", "TUE" va h.k.
// 	const nowTime = now.format("HH:mm"); // "14:30" formatida

// 	// Bugungi kun boshlanishi va tugashi (UTC)
// 	const startOfToday = now.startOf("day").toDate();
// 	const endOfToday = now.endOf("day").toDate();

// 	try {
// 		const absentStudents = await prisma.$queryRaw`
//             SELECT
//                 g.name as group_name,
//                 g.id as group_id,
//                 s.id as student_id,
//                 s.full_name,
//                 s.phone,
//                 s.parents_name,
//                 s.parents_phone,
//                 g.lesson_time
//             FROM "groups" g
//             -- 1. Guruhdagi aktiv o'quvchilarni bog'laymiz
//             JOIN "enrollments" e ON g.id = e.group_id AND e.status = 'ACTIVE'
//             JOIN "students" s ON e.student_id = s.id AND s.status = 'ACTIVE'

//             -- 2. Bugungi davomatni bog'laymiz (LEFT JOIN yordamida)
//             LEFT JOIN "attendance" att ON (
//                 att.group_id = g.id AND
//                 att.student_id = s.id AND
//                 att.lesson_date >= ${startOfToday} AND
//                 att.lesson_date <= ${endOfToday}
//             )

//             WHERE
//                 g.tenant_id = ${tenant_id} AND
//                 g.status = 'ACTIVE' AND
//                 -- Bugun dars kuni ekanligini tekshirish
//                 ${todayDay} = ANY(g.lesson_days) AND
//                 -- Dars vaqti kelgan yoki o'tib ketganligini tekshirish
//                 g.lesson_time <= ${nowTime} AND
//                 -- Davomat qilinmagan yoki 'yo'q' (false) belgilangan bo'lsa
//                 (att.id IS NULL OR att.status = false)

//             ORDER BY g.name ASC, s.full_name ASC;
//         `;

// 		return absentStudents;
// 	} catch (error) {
// 		console.error("AbsentStudents SQL Error:", error);
// 		return [];
// 	}
// }

async function GetDebtAnalysis(tenant_id) {
	try {
		const now = new Date();
		const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		// Barcha hisob-kitobni bitta SQL so'rovida bajaramiz
		const stats = await prisma.$queryRaw`
            SELECT 
                -- 1. Umumiy qarzdorlar soni (balansi manfiylar)
                COUNT(*) FILTER (WHERE balance < 0)::INT as "debtorCount",
                
                -- 2. Umumiy qarz miqdori (absolyut qiymat yig'indisi)
                COALESCE(SUM(ABS(balance)) FILTER (WHERE balance < 0), 0)::FLOAT as "totalDebtAmount",
                
                -- 3. Eski qarzdorlar (o'tgan oyda billing bo'lgan yoki hali bo'lmagan manfiy balanslilar)
                COUNT(*) FILTER (
                    WHERE balance < 0 
                    AND (last_billed_at IS NULL OR last_billed_at < ${currentMonthStart})
                )::INT as "oldDebtorsCount"
            FROM "students"
            WHERE tenant_id = ${tenant_id} 
              AND status = 'ACTIVE';
        `;

		const { debtorCount, totalDebtAmount, oldDebtorsCount } = stats[0];

		// Farqni (Percentage) hisoblash
		let diffPercentage = 0;
		if (oldDebtorsCount > 0) {
			diffPercentage =
				((debtorCount - oldDebtorsCount) / oldDebtorsCount) * 100;
		} else if (debtorCount > 0) {
			diffPercentage = 100;
		}

		return {
			debtorCount: debtorCount,
			totalDebtAmount: totalDebtAmount,
			diffPercentage: Number(diffPercentage.toFixed(1)),
			trend: debtorCount >= oldDebtorsCount ? "up" : "down",
		};
	} catch (error) {
		console.error("Debt Analysis SQL Error:", error);
		return {
			debtorCount: 0,
			totalDebtAmount: 0,
			diffPercentage: 0,
			trend: "stable",
		};
	}
}

async function GetDashboardStats(tenant_id) {
	try {
		const now = new Date();
		const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

		// Barcha sanoqlar bitta so'rovda
		const stats = await prisma.$queryRaw`
            SELECT 
                -- Talabalar statistikasi
                COUNT(*) FILTER (WHERE status = 'ACTIVE') AS "currentStudents",
                COUNT(*) FILTER (WHERE status = 'ACTIVE' AND created_at < ${thisMonthStart}) AS "lastMonthStudents",
                
                -- Guruhlar statistikasi
                (SELECT COUNT(*) FROM "groups" WHERE tenant_id = ${tenant_id} AND status = 'ACTIVE') AS "currentGroups",
                (SELECT COUNT(*) FROM "groups" WHERE tenant_id = ${tenant_id} AND status = 'ACTIVE' AND created_at < ${thisMonthStart}) AS "lastMonthGroups"
            FROM "students"
            WHERE tenant_id = ${tenant_id};
        `;

		const {
			currentStudents,
			lastMonthStudents,
			currentGroups,
			lastMonthGroups,
		} = stats[0];

		// Foizlarni hisoblash funksiyasi (xuddi siznikidek)
		const calculateGrowth = (current, previous) => {
			const cur = Number(current);
			const prev = Number(previous);
			if (prev === 0) return cur > 0 ? 100 : 0;
			return (((cur - prev) / prev) * 100).toFixed(0);
		};

		return {
			students: {
				total: Number(currentStudents),
				growth: calculateGrowth(currentStudents, lastMonthStudents),
				status:
					Number(currentStudents) >= Number(lastMonthStudents) ? "up" : "down",
			},
			groups: {
				total: Number(currentGroups),
				growth: calculateGrowth(currentGroups, lastMonthGroups),
				status:
					Number(currentGroups) >= Number(lastMonthGroups) ? "up" : "down",
			},
		};
	} catch (error) {
		console.error("Dashboard Stats SQL Error:", error);
		throw error;
	}
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

export default {
	AbsentStudents,
	MonthlyIncome,
	TodayLessons,
	GetDebtAnalysis,
	GetDashboardStats,
};
