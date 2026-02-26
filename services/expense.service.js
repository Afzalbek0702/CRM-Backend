import prisma from "../lib/prisma.js";

async function create(data) {
	const { description, amount, method, created_by } = data;
	// create metodi avtomatik ravishda yangi obyektni qaytaradi
	return await prisma.expenses.create({
		data: {
			description,
			amount: parseFloat(amount),
			method,
			created_by: parseInt(created_by),
		},
	});
}

async function getAll() {
	// Faqat statusi 'DELETED' bo'lgan xarajatlarni olish
	return await prisma.expenses.findMany({
		where: { status: "DELETED" },
		orderBy: { created_at: "desc" },
	});
}

async function update(data) {
	const { description, amount, method, created_by, id } = data;
	return await prisma.expenses.update({
		where: { id: parseInt(id) },
		data: {
			description,
			amount: parseFloat(amount),
			method,
			created_by: parseInt(created_by),
		},
	});
}

async function deleteByid(id) {
	// Soft delete: statusni 'DELETED' ga o'zgartirish
	return await prisma.expenses.update({
		where: { id: parseInt(id) },
		data: { status: "DELETED" },
	});
}

export default { create, deleteByid, getAll, update };
