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
	const add = await prisma.enrollments.findMany({
		where: {
			student_id: parseInt(student_id),
			group_id: parseInt(group_id),
			tenant_id: tenant_id,
			status: "ACTIVE",
		},
	});
	if (add) {
		await prisma.$transaction(async tx => {
			// 1. Eskisini arxivlash
			await tx.enrollments.updateMany({
				where: {
					tenant_id: tenant_id,
					student_id: parseInt(student_id),
					group_id: parseInt(add?.group_id),
					status: "ACTIVE",
				},
				data: { status: "ARCHIVED" },
			});

			await tx.enrollments.create({
				data: {
					student_id: parseInt(student_id),
					group_id: parseInt(group_id),
					status: "ACTIVE",
					joined_at: new Date(),
				},
			});

			return { message: "Student muvaffaqiyatli transfer qilindi" };
		});
	}

	return await prisma.enrollments.create({
		data: {
			student_id: parseInt(student_id),
			group_id: parseInt(group_id),
			tenant_id: tenant_id,
		},
	});
}
