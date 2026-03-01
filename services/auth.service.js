import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

async function registerWorker(data) {
	const {
		full_name,
		phone,
		password,
		salary,
		birthday,
		position,
		img,
		salary_type,
		role,
	} = data;

	// 1. Telefon raqam borligini tekshirish
	const existingUser = await prisma.users.findUnique({
		where: { phone },
	});

	if (existingUser)
		throw {
			message: "Bu telefon raqam allaqachon ro'yxatdan o'tgan",
			statusCode: 400,
		};

	// 2. Parolni xashlash
	const salt = await bcrypt.genSalt(10);
	const password_hash = await bcrypt.hash(password, salt);

	// 3. Transaction - barcha ma'lumotlarni birgalikda yaratish
	const result = await prisma.$transaction(async (tx) => {
		// A. User yaratish
		const newUser = await tx.users.create({
			data: {
				phone,
				password_hash,
				role: role || "WORKER",
			},
		});

		// B. Worker yaratish
		const newWorker = await tx.workers.create({
			data: {
				user_id: newUser.id,
				full_name: full_name || "Ism yo'q",
				phone: phone,
				position: position || (role === "TEACHER" ? "TEACHER" : "WORKER"),
				salary: salary ? parseFloat(salary) : null,
				salary_type: salary_type || "CASH",
            birthday: birthday ? new Date(birthday) : null,
            img: img || null,
			},
		});

		// C. Agar TEACHER bo'lsa, teacher profilini ham yaratish
		let newTeacher = null;
		if (role === "TEACHER") {
			newTeacher = await tx.teachers.create({
				data: {
					workerId: newWorker.id,
					full_name: newWorker.full_name,
					phone: newWorker.phone,
				},
			});
		}

		return { newUser, newWorker, newTeacher };
	});
	return result;
}
async function login(phone, password) {
	const user = await prisma.users.findUnique({
		where: { phone },
		include: {
			worker: {
				include: {
					teacher: true,
				},
			},
		},
	});

	if (!user)
		throw {
			message: "Foydalanuvchi topilmadi",
			statusCode: 404,
		};
	// 3. Statusni tekshirish
	if (user.status !== "ACTIVE") {
		throw {
			message: "Hisobingiz bloklangan. Ma'muriyatga murojaat qiling",
			statusCode: 403,
		};
	}
	// 4. Parolni tekshirish
	const isPasswordValid = await bcrypt.compare(password, user.password_hash);

	if (!isPasswordValid)
		throw {
			message: "Parol noto‘g‘ri",
			statusCode: 400,
		};
   
	const token = jwt.sign(
		{
			id: user.id,
			phone: user.phone,
			username: user.worker.full_name,
			role: user.role,
		},
		process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES },
	);
	// 6. Foydalanuvchi ma'lumotlarini tayyorlash
	const userData = {
		id: user.id,
		phone: user.phone,
		username: user.worker.full_name,
		role: user.role,
		created_at: user.created_at,
	};

	let profileData = null;
	if (user.worker) {
		profileData = {
			id: user.worker.id,
			full_name: user.worker.full_name,
			phone: user.worker.phone,
			position: user.worker.position,
			salary: user.worker.salary,
			salary_type: user.worker.salary_type,
			birthday: user.worker.birthday,
			img: user.worker.img,
			hired_at: user.worker.hired_at,
		};

		// Agar teacher bo'lsa
		if (user.role === "TEACHER" && user.worker.teacher) {
			profileData.teacher_id = user.worker.teacher.id;
		}
	}

	// 7. Muaffaqiyatli javob
	return {
		token,
		user: userData,
		profile: profileData,
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
