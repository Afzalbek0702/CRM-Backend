import prisma from "../lib/prisma.js";

async function getAll() {
	// SELECT * FROM workers
	return await prisma.workers.findMany();
}

async function updateRole(id, role) {
	// UPDATE users SET role = $1 WHERE id = $2
	return await prisma.users.update({
		where: { id: parseInt(id) },
		data: { role },
	});
}

async function update(data) {
	const { full_name, phone, position, salary, birthday, img, id, user_id } =
		data;

	// Prisma Transaction: Ikkala amal ham muvaffaqiyatli bo'lishi shart
	// Agar birontasi xato bersa, Prisma avtomatik "ROLLBACK" qiladi
	return await prisma.$transaction([
		prisma.workers.update({
			where: { id: parseInt(id) },
			data: {
				full_name,
				phone,
				position,
				salary: parseFloat(salary), // Decimal yoki Float bo'lsa
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
	// DELETE FROM users WHERE id = $1
	// Eslatma: Agar bazada ON DELETE CASCADE bo'lsa, bog'langan worker ham o'chadi
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
