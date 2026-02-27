import prisma from "../lib/prisma.js";

async function getAll() {
	const payments = await prisma.payments.findMany({
		where: {
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
	const { student_id, group_id, amount, method, paid_month } = data;
	return await prisma.payments.create({
		data: {
			student_id: parseInt(student_id),
			group_id: parseInt(group_id),
			amount: parseFloat(amount),
			method,
			paid_month: new Date(paid_month),
		},
	});
}

async function getById(id) {
	const payment = await prisma.payments.findUnique({
		where: { id: parseInt(id) },
	});
	if (!payment) throw { message: "To'lov topilmadi", statusCode: 404 };
	return payment;
}

async function update(id, data) {
	const { student_id, group_id, amount, method, paid_month } = data;
	return await prisma.payments.update({
		where: { id: parseInt(id) },
		data: {
			student_id: parseInt(student_id),
			group_id: parseInt(group_id),
			amount: parseFloat(amount),
			method,
			paid_month: new Date(paid_month),
		},
	});
}

async function deleteById(id) {
	return await prisma.payments.update({
		where: { id: parseInt(id) },
		data: {
			status: "DELETED",
			deleted_at: new Date(),
		},
	});
}

export default {
	getAll,
	create,
	getById,
	update,
	deleteById,
};
