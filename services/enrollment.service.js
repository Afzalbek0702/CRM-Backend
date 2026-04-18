import prisma from "../lib/prisma.js";

export async function get(tenant_id) {
	return await prisma.enrollments.findMany({
		where: {
			tenant_id: tenant_id,
			status: "ACTIVE",
		},
	});
}

export async function create(student_id, group_id, tenant_id) {
	const sId = parseInt(student_id);
	const gId = parseInt(group_id);

	// 1. Mavjud aktiv enrollmentni tekshiramiz
	const existingEnrollment = await prisma.enrollments.findFirst({
		where: {
			student_id: sId,
			tenant_id: tenant_id,
			status: "ACTIVE",
		},
	});

	// 2. Tranzaksiya boshlaymiz
	return await prisma.$transaction(async tx => {
		if (existingEnrollment) {
			// Agar o'sha guruhda allaqachon bo'lsa, xatolik berish yoki qaytarish (ixtiyoriy)
			if (existingEnrollment.group_id === gId) {
				throw new Error("Talaba allaqachon ushbu guruhda aktiv");
			}

			// Eskisini arxivlash
			await tx.enrollments.updateMany({
				where: {
					id: existingEnrollment.id, // ID orqali aniq nuqtaga uramiz
					tenant_id: tenant_id,
				},
				data: { status: "ARCHIVED" },
			});
		}

		// Yangi enrollment yaratish (bu har ikkala holatda ham bitta joyda bo'lishi kifoya)
		const newEnrollment = await tx.enrollments.create({
			data: {
				student_id: sId,
				group_id: gId,
				tenant_id: tenant_id,
				status: "ACTIVE",
			},
		});
		const { price } = await tx.groups.findUnique({
			where: { id: gId, tenant_id: tenant_id, status: "ACTIVE" },
			select: { price: true },
		});

		await tx.students.update({
			where: { id: sId, tenant_id: tenant_id, status: "ACTIVE" },
			data: {
				balance: { decrement: price },
			},
		});

		return {
			message: existingEnrollment ? "Transfer qilindi" : "Yaratildi",
			data: newEnrollment,
		};
	});
}
