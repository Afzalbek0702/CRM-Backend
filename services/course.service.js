import prisma from "../lib/prisma.js";

async function get(tenant_id) {
	return await prisma.courses.findMany({
		where: { status: "ACTIVE", tenant_id },
	});
}

async function create(name, price, lesson_count, tenant_id) {
	return await prisma.courses.create({
		data: {
			name,
			price: parseFloat(price),
			lesson_count: parseInt(lesson_count),
			tenant_id,
		},
	});
}

async function update(data) {
	const { id, tenant_id, ...updateData } = data;
	return await prisma.courses.update({
		where: { id: parseInt(id) },
		data: {
			name: updateData.name,
			price: parseFloat(updateData.price),
			lesson_count: parseInt(updateData.lesson_count),
			tenant_id,
		},
	});
}

async function deleteById(id) {
	return await prisma.courses.update({
		where: { id: parseInt(id), tenant_id },
		data: { status: "DELETED" },
	});
}

export default { get, create, update, deleteById };
