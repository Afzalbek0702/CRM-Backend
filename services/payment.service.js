import prisma from "../lib/prisma.js";
import { getMonthRange } from "../utils/date.js";

async function getAll(tenant_id) {
	const payments = await prisma.payments.findMany({
		where: {
			tenant_id: tenant_id,
			status: { not: "DELETED" },
		},
		include: {
			students: { select: { full_name: true } },
			groups: { select: { name: true } },
		},
		orderBy: {
			paid_at: "desc",
		},
	});

	return payments.map(p => ({
		id: p.id,
		student_name: p.students?.full_name,
		group_name: p.groups?.name,
		amount: p.amount,
		paid_at: p.paid_at,
		paid_month: p.paid_month,
		method: p.method,
	}));
}

async function create(data) {
	const { student_id, group_id, amount, method, paid_month, tenant_id } = data;
	const sId = parseInt(student_id);
	const gId = parseInt(group_id);
	const amt = parseFloat(amount);

	return await prisma.$transaction(async tx => {
		const payment = await tx.payments.create({
			data: {
				student_id: sId,
				group_id: gId,
				amount: amt,
				method,
				tenant_id,
				paid_month: new Date(paid_month),
			},
		});

		await tx.students.update({
			where: { id: sId },
			data: {
				balance: { increment: amt },
			},
		});

		return payment;
	});
}

async function getById(id, tenant_id) {
	const payment = await prisma.payments.findUnique({
		where: { tenant_id: tenant_id, id: parseInt(id) },
	});
	if (!payment) throw { message: "To'lov topilmadi", statusCode: 404 };
	return payment;
}

async function update(id, data) {
	const { student_id, group_id, amount, method, paid_month, tenant_id } = data;
	return await prisma.payments.update({
		where: { tenant_id: tenant_id, id: parseInt(id) },
		data: {
			student_id: parseInt(student_id),
			group_id: parseInt(group_id),
			amount: parseFloat(amount),
			method,

			paid_month: new Date(paid_month),
		},
	});
}

async function deleteById(id, tenant_id) {
	return await prisma.payments.update({
		where: { tenant_id: tenant_id, id: parseInt(id) },
		data: {
			status: "DELETED",
			deleted_at: new Date(),
		},
	});
}
async function TopDebtors0(tenant_id) {
	try {
		const students = await prisma.students.findMany({
			where: {
				tenant_id: tenant_id,
				status: "ACTIVE",
				// Filtrlarni JS'da qilamiz, shunda hech kim tushib qolmaydi
			},
			include: {
				enrollments: {
					where: { status: "ACTIVE" },
					include: { groups: true },
				},
				payments: {
					where: { status: "ACTIVE" },
					orderBy: { paid_at: "desc" },
				},
			},
		});

		const debtorsList = students
			.map(student => {
				const currentBalance = Number(student.balance || 0);

				// 1. Jami kurslar narxini hisoblash
				const totalCoursePrice = student.enrollments.reduce(
					(sum, en) => sum + Number(en.groups?.price || 0),
					0,
				);

				// 2. Jami to'lagan summasi
				const totalPaid = student.payments.reduce(
					(sum, p) => sum + Number(p.amount || 0),
					0,
				);

				// QARZDORLIK SHARTLARI:
				// - Yoki balansi 0 dan kichik (Sizning tizimingiz bo'yicha)
				// - Yoki to'lagan puli kurs narxidan kam (Ehtiyot chorasi)
				const isNegativeBalance = currentBalance < 0;
				const isUnderPaid = totalPaid < totalCoursePrice;

				// Qarz miqdorini aniqlash (qaysi biri katta bo'lsa shuni olamiz)
				const debtAmountFromBalance = isNegativeBalance
					? Math.abs(currentBalance)
					: 0;
				const debtAmountFromPrice = isUnderPaid
					? totalCoursePrice - totalPaid
					: 0;

				const finalDebtAmount = Math.max(
					debtAmountFromBalance,
					debtAmountFromPrice,
				);

				return {
					student_id: student.id,
					full_name: student.full_name,
					group_name:
						student.enrollments
							.map(en => en.groups?.name)
							.filter(Boolean)
							.join(", ") || "Guruhsiz",
					course_price: totalCoursePrice,
					total_paid: totalPaid,
					current_balance: currentBalance,
					debt_amount: finalDebtAmount,
					last_payment_date: student.payments[0]?.paid_at || null,
					phone: student.phone,
				};
			})
			.filter(s => s.debt_amount > 0) // Faqat qarzi borlarni qoldiramiz
			.sort((a, b) => b.debt_amount - a.debt_amount); // Kattadan kichikka saralash

		return debtorsList;
	} catch (error) {
		console.error("Debtors Logic Error:", error);
		throw error;
	}
}
// gemini with prisma
async function TopDebtors4(tenant_id) {
	try {
		const students = await prisma.students.findMany({
			where: {
				tenant_id: tenant_id,
				status: "ACTIVE",
				balance: { lt: 0 }, // Faqat balansi minus bo'lganlar (haqiqiy qarzdorlar)
			},
			include: {
				enrollments: {
					where: { status: "ACTIVE" },
					include: { groups: true },
				},
				payments: {
					// Oxirgi to'lov sanasini va jami to'lovni hisoblash uchun
					where: { status: "ACTIVE" },
					orderBy: { paid_at: "desc" },
				},
			},
		});

		const debtorsList = students.map(student => {
			const currentBalance = Number(student.balance || 0);

			// 1. Jami kurslar narxi (Bir oylik majburiyati)
			const totalCoursePrice = student.enrollments.reduce(
				(sum, en) => sum + Number(en.groups?.price || 0),
				0,
			);

			// 2. Jami to'lagan summasi (Faqat musbat to'lovlar, ya'ni kirimlar)
			const totalPaid = student.payments
				.filter(p => Number(p.amount) > 0)
				.reduce((sum, p) => sum + Number(p.amount || 0), 0);

			// 3. Qarz miqdori
			// Balans minus bo'lgani uchun uning absolyut qiymati haqiqiy qarzdir
			const finalDebtAmount = Math.abs(currentBalance);

			return {
				student_id: student.id,
				full_name: student.full_name,
				group_name:
					student.enrollments
						.map(en => en.groups?.name)
						.filter(Boolean)
						.join(", ") || "Guruhsiz",
				course_price: totalCoursePrice,
				total_paid: totalPaid,
				current_balance: currentBalance,
				debt_amount: finalDebtAmount,
				last_payment_date:
					student.payments.find(p => Number(p.amount) > 0)?.paid_at || null,
				phone: student.phone,
			};
		});

		// Qarz miqdori bo'yicha saralash (Kattadan kichikka)
		return debtorsList.sort((a, b) => b.debt_amount - a.debt_amount);
	} catch (error) {
		console.error("Debtors Logic Error:", error);
		throw error;
	}
}
async function TopDebtors(tenant_id) {
	try {
		const debtors = await prisma.$queryRaw`
            SELECT 
                s.id AS student_id,
                s.full_name,
                s.phone,
                -- current_balance: JS dagi Number kabi qaytishi uchun
                CAST(s.balance AS FLOAT) AS current_balance,
                -- debt_amount: Absolyut qiymat
                ABS(CAST(s.balance AS FLOAT)) AS debt_amount,
                -- group_name: string_agg orqali birlashtirilgan
                COALESCE(
                    (SELECT string_agg(g.name, ', ') 
                     FROM "enrollments" e 
                     JOIN "groups" g ON e.group_id = g.id 
                     WHERE e.student_id = s.id AND e.status = 'ACTIVE'), 
                    'Guruhsiz'
                ) AS group_name,
                -- course_price: Jami kurslar narxi
                COALESCE(
                    (SELECT SUM(CAST(g.price AS FLOAT)) 
                     FROM "enrollments" e 
                     JOIN "groups" g ON e.group_id = g.id 
                     WHERE e.student_id = s.id AND e.status = 'ACTIVE'), 
                    0
                ) AS course_price,
                -- total_paid: Jami musbat to'lovlar
                COALESCE(
                    (SELECT SUM(CAST(p.amount AS FLOAT)) 
                     FROM "payments" p 
                     WHERE p.student_id = s.id AND p.status = 'ACTIVE' AND p.amount > 0), 
                    0
                ) AS total_paid,
                -- last_payment_date: Oxirgi to'lov sanasi
                (SELECT MAX(p.paid_at) 
                 FROM "payments" p 
                 WHERE p.student_id = s.id AND p.status = 'ACTIVE' AND p.amount > 0) AS last_payment_date
            FROM "students" s
            WHERE 
                s.tenant_id = ${tenant_id}
                AND s.status = 'ACTIVE'
                AND s.balance < 0
            ORDER BY debt_amount DESC
        `;

		return debtors;
	} catch (error) {
		console.error("SQL Debtors Error:", error);
		throw error;
	}
}
// import dayjs from "dayjs";
// import utc from "dayjs/plugin/utc.js";
// dayjs.extend(utc);

// async function TopDebtors3(tenantId, forMonth) {
// 	// Sanani UTC da aniq belgilab olamiz
// 	const targetDate = forMonth
// 		? dayjs.utc(forMonth).startOf("month")
// 		: dayjs.utc("2026-03-01");

// 	const startOfMonth = targetDate.toDate(); // Date object
// 	const endOfMonth = targetDate.endOf("month").toDate(); // Date object
// 	const startOfNextMonth = targetDate.add(1, "month").startOf("month").toDate();

// 	const debtList = await prisma.$queryRaw`
//     SELECT
//       res.student_id,
//       res.full_name,
//       res.phone,
//       res.expected_amount,
//       res.paid_amount,
//       res.last_payment_date,
//       (res.expected_amount - res.paid_amount) as debt_amount
//     FROM (
//       SELECT
//         s.id as student_id,
//         s.full_name,
//         s.phone,
//         -- Har bir aktiv enrollment uchun guruh narxini hisoblash
//         COALESCE((
//           SELECT SUM(g.price)
//           FROM enrollments e
//           JOIN groups g ON e.group_id = g.id
//           WHERE e.student_id = s.id
//             AND e.status = 'ACTIVE'
//             AND g.status = 'ACTIVE'
//             AND e.tenant_id = ${tenantId}
//             AND e.joined_at < ${startOfNextMonth}
//         ), 0) as expected_amount,
//         -- Shu oy uchun qilingan to'lovlar
//         COALESCE((
//           SELECT SUM(p.amount)
//           FROM payments p
//           WHERE p.student_id = s.id
//             AND p.status = 'ACTIVE'
//             AND p.tenant_id = ${tenantId}
//             AND p.paid_month = ${startOfMonth}
//         ), 0) as paid_amount,
//         -- Oxirgi to'lov sanasi
//         (
//           SELECT MAX(p.paid_at)
//           FROM payments p
//           WHERE p.student_id = s.id
//             AND p.tenant_id = ${tenantId}
//             AND p.status = 'ACTIVE'
//         ) as last_payment_date
//       FROM students s
//       WHERE s.tenant_id = ${tenantId}
//         AND s.status = 'ACTIVE'
//     ) as res
//     WHERE (res.expected_amount - res.paid_amount) > 0
//     ORDER BY (res.expected_amount - res.paid_amount) DESC;
//   `;

// 	return debtList;
// }
//qwen
// async function TopDebtors(tenantId, forMonth) {
// 	const target = forMonth ? new Date(forMonth) : new Date("2026-03-22");
// 	const { start: startStr, nextStart: nextStartStr } = getMonthRange(target);
// 	console.log(target, "1");
// 	console.log(startStr, "2");
// 	console.log(nextStartStr, "3");

// 	const debtList = await prisma.$queryRaw`
//     WITH due_fees AS (
//       SELECT e.student_id, SUM(g.price) as expected_amount
//       FROM enrollments e
//       JOIN groups g ON e.group_id = g.id AND g.status = 'ACTIVE'
//       WHERE e.status = 'ACTIVE' AND e.next_billing_date <= ${startStr}::date
//       GROUP BY e.student_id
//     ),
//     paid_stats AS (
//       SELECT student_id, SUM(amount) as paid_amount, MAX(paid_at) as last_paid
//       FROM payments
//       WHERE tenant_id = ${tenantId} AND status = 'ACTIVE'
//         AND paid_month >= ${startStr}::date AND paid_month < ${nextStartStr}::date
//       GROUP BY student_id
//     )
//     SELECT
//       s.id as student_id,
//       s.full_name,
//       s.phone,
//       df.expected_amount,
//       COALESCE(ps.paid_amount, 0) as paid_amount,
//       COALESCE(ps.last_paid, null) as last_payment_date,
//       (df.expected_amount - COALESCE(ps.paid_amount, 0)) as debt_amount
//     FROM students s
//     JOIN due_fees df ON s.id = df.student_id
//     LEFT JOIN paid_stats ps ON s.id = ps.student_id
//     WHERE s.tenant_id = ${tenantId}
//       AND s.status = 'ACTIVE'
//       AND df.expected_amount > COALESCE(ps.paid_amount, 0)
//     ORDER BY debt_amount DESC
//   `;
//    console.log(debtList);

// }

export default {
	getAll,
	create,
	getById,
	update,
	deleteById,
	TopDebtors,
};
