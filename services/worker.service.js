import prisma from "../lib/prisma.js";

async function getAll(tenant_id) {
	return await prisma.workers.findMany({ where: { tenant_id: tenant_id } });
}

async function updateRole(id, role, tenant_id) {
	const ceo = await prisma.users.findUnique({
		where: { tenant_id: tenant_id, id: parseInt(id) },
	});
	if (ceo.role == "CEO")
		throw { message: "CEO ni o'zgartirish  mumkin emas", statusCode: 409 };

	return await prisma.users.update({
		where: { tenant_id: tenant_id, id: parseInt(id) },
		data: { role },
	});
}

async function update(data) {
	const {
		full_name,
		phone,
		position,
		salary,
		birthday,
		img,
		id,
		user_id,
		tenant_id,
	} = data;

	return await prisma.$transaction([
		prisma.workers.update({
			where: { tenant_id: tenant_id, id: parseInt(id) },
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

async function deleteById(id, tenant_id) {
	const user = prisma.workers.findUnique({
		where: { id: parseInt(id), tenant_id: tenant_id },
	});
	if (!user) throw { message: "User not found",statusCode:404 };
	return await prisma.workers.delete({
		where: { tenant_id: tenant_id, id: parseInt(id) },
	});
}

export default {
	getAll,
	updateRole,
	update,
	deleteById,
};
