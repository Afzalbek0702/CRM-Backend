import prisma from "../lib/prisma.js";

async function registerWorker(userData, workerData) {
	// Prisma Tranzaksiyasi
	return await prisma.$transaction(async (tx) => {
		// 1. User yaratish
		const user = await tx.users.create({
			data: {
				phone: userData.phone,
				password_hash: userData.hash,
				role: userData.role,
			},
		});

		// 2. Worker yaratish
		const worker = await tx.workers.create({
			data: {
				user_id: user.id,
				full_name: workerData.full_name,
				phone: workerData.phone,
				position: workerData.position,
				salary: parseFloat(workerData.salary) || 0,
				birthday: workerData.birthday ? new Date(workerData.birthday) : null,
				img: workerData.img,
			},
		});

		return { user, worker };
	});
}

async function checkLogin(phone) {
	return await prisma.users.findFirst({
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
}

async function updatePassword(userId, newHash) {
	return await prisma.users.update({
		where: { id: parseInt(userId) },
		data: { password_hash: newHash },
	});
}

async function getUserById(userId) {
	return await prisma.users.findUnique({
		where: { id: parseInt(userId) },
	});
}

export default { registerWorker, checkLogin, updatePassword, getUserById };
// import prisma from "../lib/prisma.js";

// async function userCreate(phone, hash, position) {
// 	// INSERT INTO users ... RETURNING *
// 	const user = await prisma.users.create({
// 		data: {
// 			phone: phone,
// 			password_hash: hash,
// 			role: position,
// 		},
// 	});
// 	return [user]; // pg massiv qaytargani uchun massivga o'radim
// }

// async function workerCreate(data) {
// 	const { userId, full_name, phone, position, salary, birthday, img } = data;

// 	const worker = await prisma.workers.create({
// 		data: {
// 			user_id: parseInt(userId),
// 			full_name,
// 			phone,
// 			position,
// 			salary: parseFloat(salary),
// 			birthday: birthday ? new Date(birthday) : null,
// 			img,
// 		},
// 	});
// 	return [worker];
// }

// async function checkLogin(phone) {
// 	// JOIN o'rniga include ishlatamiz
// 	const user = await prisma.users.findUnique({
// 		where: {
// 			phone: phone, // phone maydoni @unique bo'lishi shart
// 		},
// 		include: {
// 			workers: {
// 				// users va workers orasidagi bog'lanish nomi
// 				select: { full_name: true },
// 			},
// 		},
// 	});

// 	// Agar user topilmasa yoki statusi ACTIVE bo'lmasa
// 	if (!user || user.status !== "ACTIVE") {
// 		return { rows: [], rowCount: 0 };
// 	}

// 	// pg qaytaradigan formatga moslashtiramiz (rows massivi ichida)
// 	return {
// 		rows: [
// 			{
// 				id: user.id,
// 				password_hash: user.password_hash,
// 				role: user.role,
// 				full_name: user.workers?.[0]?.full_name || user.workers?.full_name,
// 				// Eslatma: relation 1:1 bo'lsa obyekt, 1:n bo'lsa massiv qaytadi
// 			},
// 		],
// 		rowCount: 1,
// 	};
// }

// export default { userCreate, workerCreate, checkLogin };

// async function registerWorker(userData, workerData) {
// 	return await prisma.$transaction(async (tx) => {
// 		const user = await tx.users.create({
// 			data: {
// 				phone: userData.phone,
// 				password_hash: userData.hash,
// 				role: userData.position,
// 			},
// 		});

// 		const worker = await tx.workers.create({
// 			data: {
// 				...workerData,
// 				user_id: user.id,
// 			},
// 		});

// 		return { user, worker };
// 	});
// }
