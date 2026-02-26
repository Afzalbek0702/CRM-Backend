import prisma from "../lib/prisma.js";

async function getAll() {
	// JOIN students s ON s.id = p.student_id... o'rniga 'include' ishlatamiz
	const payments = await prisma.payments.findMany({
		where: {
			status: { not: "DELETED" },
		},
		include: {
			students: { select: { full_name: true } }, // faqat ismini olamiz
			groups: { select: { name: true } }, // faqat guruh nomini olamiz
		},
		orderBy: {
			paid_at: "desc",
		},
	});

	// Eski formatga (flat array) keltirish
	return payments.map((p) => ({
		id: p.id,
		amount: p.amount,
		paid_at: p.paid_at,
		paid_month: p.paid_month,
		method: p.method,
		student_name: p.students?.full_name,
		group_name: p.groups?.name,
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
			paid_month,
		},
	});
}

async function getById(id) {
	return await prisma.payments.findUnique({
		where: { id: parseInt(id) },
	});
}

async function update(id, data) {
	const { student_id, group_id, amount, method, paid_month } = data; // SQLda 'type' deb yozgan ekansiz, 'method' deb o'zgartirdim
	return await prisma.payments.update({
		where: { id: parseInt(id) },
		data: {
			student_id: parseInt(student_id),
			group_id: parseInt(group_id),
			amount: parseFloat(amount),
			method,
			paid_month,
		},
	});
}

async function deleteById(id) {
	// Soft delete
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
