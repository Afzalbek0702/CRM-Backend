import prisma from "../lib/prisma.js";

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

	return payments.map((p) => ({
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
   
	return await prisma.$transaction(async (tx) => {
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

async function deleteById(id,tenant_id) {
	return await prisma.payments.update({
		where: {tenant_id:tenant_id, id: parseInt(id) },
		data: {
			status: "DELETED",
			deleted_at: new Date(),
		},
	});
}
async function TopDebtors(tenant_id) {
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
export default {
	getAll,
	create,
	getById,
	update,
   deleteById,
   TopDebtors
};
