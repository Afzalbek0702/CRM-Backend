import prisma from "../lib/prisma.js";

async function create(data) {
	const { description, amount, method, created_by, tenant_id } = data;
	return await prisma.expenses.create({
		data: {
			description,
			amount: parseFloat(amount),
         method,
         tenant_id,
			created_by: parseInt(created_by),
		},
	});
}

async function getAll(tenant_id) {
	return await prisma.expenses.findMany({
		where: { tenant_id:tenant_id,status: "ACTIVE" },
		orderBy: { created_at: "desc" },
	});
}

async function update(data) {
	const { description, amount, method, created_by, id, tenant_id } = data;
	return await prisma.expenses.update({
		where: {tenant_id:tenant_id, id: parseInt(id) },
		data: {
			description,
			amount: parseFloat(amount),
			method,
			created_by: parseInt(created_by),
		},
	});
}

async function deleteByid(id, tenant_id) {
	return await prisma.expenses.update({
		where: {tenant_id:tenant_id, id: parseInt(id) },
		data: { status: "DELETED" },
	});
}

export default { create, deleteByid, getAll, update };
