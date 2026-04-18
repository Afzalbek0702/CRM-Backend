import prisma from "../lib/prisma.js";

async function create(data) {
	const { full_name, phone, source, interested_course, comment, tenant_id } =
		data;
	return await prisma.leads.create({
		data: {
			full_name,
			phone: phone.length == 12 ? phone : null,
			source,
			interested_course,
			comment,
			tenant_id,
		},
	});
}  

async function getAll(tenant_id) {
	return await prisma.leads.findMany({
		where: {
			tenant_id: tenant_id,
			status: { notIn: ["CONVERTED", "DELETED"] },
		},
		orderBy: { created_at: "desc" },
	});
}

async function getById(id, tenant_id) {
	return await prisma.leads.findUnique({
		where: { tenant_id: tenant_id, id: parseInt(id) },
	});
}

async function update(data) {
	const { full_name, phone, id, tenant_id } = data;
	return await prisma.leads.update({
		where: { tenant_id: tenant_id, id: parseInt(id) },
		data: { full_name, phone },
	});
}

async function convertToGroup(leadId, group_id, tenant_id) {
	return await prisma.$transaction(async tx => {
		const lead = await tx.leads.findUnique({
			where: { tenant_id: tenant_id, id: parseInt(leadId) },
		});

		if (!lead) {
			throw new Error("Lead not found");
		}

		const student = await tx.students.create({
			data: {
				full_name: lead.full_name,
				phone: lead.phone,
				status: "ACTIVE",
				tenant_id: tenant_id,
			},
		});

		await tx.enrollments.create({
			data: {
				student_id: student.id,
				group_id: parseInt(group_id),
				status: "ACTIVE",
				joined_at: new Date(),
				tenant_id: tenant_id,
			},
		});

		await tx.leads.update({
			where: { id: parseInt(leadId) },
			data: {
				status: "CONVERTED",
				updated_at: new Date(),
			},
		});

		return { student_id: student.id };
	});
}

async function deleteById(id, tenant_id) {
	return await prisma.leads.update({
		where: { tenant_id: tenant_id, id: parseInt(id) },
		data: { status: "DELETED" },
	});
}

async function convertToStudent(leadId, tenant_id) {
	return await prisma.$transaction(async tx => {
		// 1. Leadni qidirib topish
		const lead = await tx.leads.findUnique({
			where: {
				id: parseInt(leadId),
				tenant_id: tenant_id,
			},
		});

		if (!lead) {
			throw new Error("Lead topilmadi");
		}

		// 2. Talaba yaratish (Guruhsiz)
		const student = await tx.students.create({
			data: {
				full_name: lead.full_name,
				phone: lead.phone,
				status: "ACTIVE", // Yoki "PENDING" qilish ham mumkin
				tenant_id: tenant_id,
				// Agar bazada created_at bo'lsa, avtomatik Date.now() bo'ladi
			},
		});

		// 3. Lead statusini o'zgartirish
		await tx.leads.update({
			where: { id: parseInt(leadId) },
			data: {
				status: "CONVERTED",
				updated_at: new Date(),
			},
		});

		return { student_id: student.id };
	});
}

export default {
	create,
	getAll,
	getById,
	update,
	convertToGroup,
	deleteById,
	convertToStudent,
};
