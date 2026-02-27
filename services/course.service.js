import prisma from "../lib/prisma.js";

async function get() {
	return await prisma.courses.findMany({
		where: { status: "ACTIVE" },
	});
}

async function create(name, price, lesson_count) {
	return await prisma.courses.create({
		data: {
			name,
			price: parseFloat(price),
			lesson_count: parseInt(lesson_count),
		},
	});
}

async function update(data) {
	const { id, ...updateData } = data;
	return await prisma.courses.update({
		where: { id: parseInt(id) },
		data: {
			name: updateData.name,
			price: parseFloat(updateData.price),
			lesson_count: parseInt(updateData.lesson_count),
		},
	});
}

async function deleteById(id) {
	return await prisma.courses.update({
		where: { id: parseInt(id) },
		data: { status: "DELETED" },
	});
}

export default { get, create, update, deleteById };
