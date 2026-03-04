import prisma from "../lib/prisma.js";

async function getAll(tenant_id) {
	return await prisma.workers.findMany({ where: { tenant_id: tenant_id } });
}

async function updateRole(id, role, tenant_id) {
	return await prisma.users.update({
		where: {tenant_id:tenant_id, id: parseInt(id) },
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
			where: {tenant_id:tenant_id, id: parseInt(id) },
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
	return await prisma.users.delete({
		where: {tenant_id:tenant_id, id: parseInt(id) },
	});
}

export default {
	getAll,
	updateRole,
	update,
	deleteById,
};
