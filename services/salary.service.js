import prisma from "../lib/prisma.js";

async function get() {
	return await prisma.salary.findMany({
		where: { status: "ACTIVE" },
	});
}

async function create(data) {
	return await prisma.salary.create({
		data: {
			full_name: data.full_name,
			amount: data.amount,
			method: data.method,
			description: data.description,
		},
	});
}

async function update(data) {
	return await prisma.salary.update({
		where: { id: parseInt(data.id) },
		data: {
			full_name: data.full_name,
			amount: data.amount,
			method: data.method,
			description: data.description,
		},
	});
}

async function deleteById(id) {
	return await prisma.salary.update({
		where: { id: parseInt(id) },
		data: { status: "DELETED" },
	});
}

export default { get, create, update, deleteById };