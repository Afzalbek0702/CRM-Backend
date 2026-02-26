import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendError, sendSuccess } from "../lib/response.js";
import authService from "../services/auth.service.js";

export async function registerWorker(req, res) {
	const { full_name, phone, password, salary, birthday, position, img } =
		req.body;

	if (!phone || !password || !full_name || !position) {
		return sendError(
			res,
			"Majburiy maydonlar to‘ldirilmagan! phone, password, full_name, position",
			400,
		);
	}

	try {
		const hash = await bcrypt.hash(password, 10);

	 const data =	await authService.registerWorker(
			{ phone, hash, role: position },
			{ full_name, phone, position, salary, birthday, img },
		);

		sendSuccess(res, data, 201);
	} catch (err) {
		sendError(res, "Registerda xatolik", 500, err.message);
	}
}

export async function login(req, res) {
	const { phone, password } = req.body;

	try {
		const user = await authService.checkLogin(phone);

		if (!user) {
			return sendError(
				res,
				"Telefon raqam noto‘g‘ri yoki profil faol emas",
				400,
			);
		}

		const match = await bcrypt.compare(password, user.password_hash);
		if (!match) {
			return sendError(res, "Parol noto‘g‘ri", 400);
		}

		const token = jwt.sign(
			{ id: user.id, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES },
		);

		sendSuccess(res, {
			token,
			user: {
				id: user.id,
				full_name: user.workers[0]?.full_name || "Xodim",
				role: user.role,
			},
		});
	} catch (err) {
		sendError(res, "Server xatosi", 500, err.message);
	}
}

export async function changePassword(req, res) {
	const userId = req.user.id;
	const { oldPassword, newPassword } = req.body;

	try {
		const user = await authService.getUserById(userId);
		if (!user) return sendError(res, "User topilmadi", 404);

		const match = await bcrypt.compare(oldPassword, user.password_hash);
		if (!match) return sendError(res, "Eski password noto‘g‘ri", 400);

		const newHash = await bcrypt.hash(newPassword, 10);
	 const data =await authService.updatePassword(userId, newHash);

		sendSuccess(res,data);
	} catch (error) {
		sendError(res, "Server xatosi", 500, error.message);
	}
}

// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// import { sendError, sendSuccess } from "../lib/response.js";
// import authRepo from "../services/auth.service.js"; // Prisma servisiga o'tgan bo'lishi kerak
// import prisma from "../lib/prisma.js";

// export async function registerWorker(req, res) {
// 	const { full_name, phone, password, salary, birthday, position, img } =
// 		req.body;

// 	if (!phone || !password || !full_name || !position) {
// 		return sendError(res, "Majburiy maydonlar to‘ldirilmagan", 400);
// 	}

// 	try {
// 		// Prisma interaktiv tranzaksiyasi
// 		await prisma.$transaction(async (tx) => {
// 			const hash = await bcrypt.hash(password, 10);

// 			// 1. User yaratish
// 			// Eslatma: authRepo.userCreate funksiyasi tx (transaction) ni qabul qilishi kerak
// 			// yoki mantiqni shu yerning o'zida yozish ma'qul
// 			const user = await tx.users.create({
// 				data: {
// 					phone,
// 					password_hash: hash,
// 					role: position,
// 				},
// 			});

// 			// 2. Worker yaratish
// 			await tx.workers.create({
// 				data: {
// 					user_id: user.id,
// 					full_name,
// 					phone,
// 					position,
// 					salary: parseFloat(salary),
// 					birthday: birthday ? new Date(birthday) : null,
// 					img,
// 				},
// 			});
// 		});

// 		sendSuccess(res, { message: "Xodim muvaffaqiyatli ro‘yxatdan o‘tdi" }, 201);
// 	} catch (err) {
// 		console.error(err);
// 		sendError(res, "Registerda xatolik", 500, err);
// 	}
// }

// export async function login(req, res) {
// 	const { phone, password } = req.body;

// 	try {
// 		// authRepo.checkLogin o'rniga to'g'ridan-to'g'ri Prisma ishlatish qulay
// 		const user = await prisma.users.findFirst({
// 			where: {
// 				phone: phone,
// 				status: "ACTIVE",
// 			},
// 			include: {
// 				workers: {
// 					select: { full_name: true },
// 				},
// 			},
// 		});

// 		if (!user) {
// 			return sendError(
// 				res,
// 				"Telefon raqam noto‘g‘ri yoki profil faol emas",
// 				400,
// 			);
// 		}

// 		const match = await bcrypt.compare(password, user.password_hash);
// 		if (!match) {
// 			return sendError(res, "Parol noto‘g‘ri", 400);
// 		}

// 		const token = jwt.sign(
// 			{ id: user.id, role: user.role },
// 			process.env.JWT_SECRET,
// 			{ expiresIn: process.env.JWT_EXPIRES },
// 		);

// 		sendSuccess(res, {
// 			token,
// 			user: {
// 				id: user.id,
// 				full_name: user.workers[0]?.full_name || "Xodim",
// 				role: user.role,
// 			},
// 		});
// 	} catch (err) {
// 		sendError(res, "Loginda xatolik", 500, err);
// 	}
// }

// export async function changePassword(req, res) {
// 	const userId = req.user.id;
// 	const { oldPassword, newPassword } = req.body;

// 	if (!oldPassword || !newPassword) {
// 		return sendError(res, "Passwordlar to‘liq emas", 400);
// 	}

// 	try {
// 		// 1. Userni topish
// 		const user = await prisma.users.findUnique({
// 			where: { id: parseInt(userId) },
// 		});

// 		if (!user) {
// 			return sendError(res, "User topilmadi", 404);
// 		}

// 		// 2. Eski passwordni tekshirish
// 		const match = await bcrypt.compare(oldPassword, user.password_hash);
// 		if (!match) {
// 			return sendError(res, "Eski password noto‘g‘ri", 400);
// 		}

// 		// 3. Yangi parolni hash qilish va yangilash
// 		const newHash = await bcrypt.hash(newPassword, 10);
// 		await prisma.users.update({
// 			where: { id: parseInt(userId) },
// 			data: { password_hash: newHash },
// 		});

// 		sendSuccess(res, { message: "Password muvaffaqiyatli yangilandi" });
// 	} catch (error) {
// 		sendError(res, "Password update xatosi", 500, error);
// 	}
// }
