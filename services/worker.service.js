import prisma from "../lib/prisma.js";

async function getAll() {
	return await prisma.workers.findMany();
}

async function updateRole(id, role) {
	return await prisma.users.update({
		where: { id: parseInt(id) },
		data: { role },
	});
}

async function update(data) {
	const { full_name, phone, position, salary, birthday, img, id, user_id } =
		data;

	return await prisma.$transaction([
		prisma.workers.update({
			where: { id: parseInt(id) },
			data: {
				full_name,
				phone,
				position,
				salary: parseFloat(salary),
				birthday: birthday ? new Date(birthday) : null,
				img,
			},
		}),
		prisma.users.update({
			where: { id: parseInt(user_id) },
			data: { phone },
		}),
	]);
}

async function deleteById(id) {
	return await prisma.users.delete({
		where: { id: parseInt(id) },
	});
}

export default {
	getAll,
	updateRole,
	update,
	deleteById,
};
