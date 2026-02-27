import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function registerWorker(data) {
	const { full_name, phone, password, salary, birthday, position, img } = data;
	const hash = await bcrypt.hash(password, 10);

	return await prisma.$transaction(async (tx) => {
		const user = await tx.users.create({
			data: {
				phone: phone,
				password_hash: hash,
				role: position,
			},
		});

		const worker = await tx.workers.create({
			data: {
				user_id: user.id,
				full_name: full_name,
				phone: phone,
				position: position,
				salary: parseFloat(salary) || 0,
				birthday: birthday ? new Date(birthday) : null,
				img: img,
			},
		});

		return { user, worker };
	});
}
async function login(phone, password) {
	const user = await prisma.users.findFirst({
		where: {
			phone: phone,
			status: "ACTIVE",
		},
		include: {
			workers: {
				select: { full_name: true },
			},
		},
	});
	if (!user)
		throw {
			message: "Telefon raqam noto‘g‘ri yoki profil faol emas",
			statusCode: 400,
		};
	const match = await bcrypt.compare(password, user.password_hash);
	if (!match)
		throw {
			message: "Parol noto‘g‘ri",
			statusCode: 400,
      };
   
	const token = jwt.sign(
		{ id: user.id, role: user.role,username: user.workers.full_name || "Xodim" },
		process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES },
	);
	return {
		token,
		user: {
			id: user.id,
			full_name: user.workers.full_name || "Xodim",
			role: user.role,
		},
	};
}

async function updatePassword(userId, oldPassword, newPassword) {
	const user = await prisma.users.findUnique({
		where: { id: parseInt(userId) },
	});
	if (!user) throw { message: "User topilmadi", statusCode: 404 };

	const match = await bcrypt.compare(oldPassword, user.password_hash);
	if (!match) throw { message: "Eski password noto‘g‘ri", statusCode: 400 };

	const newHash = await bcrypt.hash(newPassword, 10);

	return await prisma.users.update({
		where: { id: parseInt(userId) },
		data: { password_hash: newHash },
	});
}

export default { registerWorker, login, updatePassword };
