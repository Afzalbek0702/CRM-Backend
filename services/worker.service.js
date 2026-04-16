import prisma from "../lib/prisma.js";

async function getAll(tenant_id) {
	const workers = await prisma.workers.findMany({
		where: {
			tenant_id: tenant_id,
		},
		include: {
			user: {
				select: {
					role: true,
				},
			},
		},
	});

	return workers.map(worker => ({
		...worker,
		role: worker.user.role,
		user: undefined,
	}));
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
	const { id, user_id, tenant_id, password, ...rest } = data;

	// 1. Workers jadvali uchun faqat kelgan ma'lumotlarni yig'amiz
	const workerUpdateData = {};
	if (rest.full_name) workerUpdateData.full_name = rest.full_name;
	if (rest.phone) workerUpdateData.phone = rest.phone;
	if (rest.position) workerUpdateData.position = rest.position;
	if (rest.salary) workerUpdateData.salary = parseFloat(rest.salary);
	if (rest.birthday) workerUpdateData.birthday = new Date(rest.birthday);
	if (rest.img !== undefined) workerUpdateData.img = rest.img;

	// 2. Users jadvali uchun yangilanishlar
	const userUpdateData = {};
	if (rest.phone) userUpdateData.phone = rest.phone;

	// Parol o'zgargan bo'lsagina xeshlaymiz
	if (password && password.trim() !== "") {
		const salt = await bcrypt.genSalt(10);
		userUpdateData.password_hash = await bcrypt.hash(password, salt);
	}

	// 3. Bazaga yozish
	return await prisma.$transaction(async tx => {
		const updatedWorker = await tx.workers.update({
			where: {
				tenant_id: tenant_id,
				id: parseInt(id),
			},
			data: workerUpdateData,
		});

		// Agar userUpdateData bo'sh bo'lmasa, users'ni ham yangilaymiz
		if (Object.keys(userUpdateData).length > 0) {
			await tx.users.update({
				where: { id: parseInt(user_id) },
				data: userUpdateData,
			});
		}

		return updatedWorker;
	});
}

async function deleteById(id, tenant_id) {
	const user = prisma.workers.findUnique({
		where: { id: parseInt(id), tenant_id: tenant_id },
	});
	if (!user) throw { message: "User not found", statusCode: 404 };
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
