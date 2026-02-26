import prisma from "../lib/prisma.js";

async function create(data) {
	const { full_name, phone, source, interested_course, comment } = data;
	return await prisma.leads.create({
		data: { full_name, phone, source, interested_course, comment },
	});
	
}

async function getAll() {
	return await prisma.leads.findMany({
		where: {
			status: { not: "CONVERTED" },
			status: { not: "DELETED" },
		},
		orderBy: { created_at: "desc" },
	});
}

async function getById(id) {
	return await prisma.leads.findUnique({
		where: { id: parseInt(id) },
	});
}

async function update(data) {
	const { full_name, phone, id } = data;
	return await prisma.leads.update({
		where: { id: parseInt(id) },
		data: { full_name, phone },
	});
}

async function convert(leadId, group_id) {
	// Tranzaksiya boshlanishi
	return await prisma.$transaction(async (tx) => {
		// 1. Lead ma'lumotlarini olish
		const lead = await tx.leads.findUnique({
			where: { id: parseInt(leadId) },
		});

		if (!lead) {
			throw new Error("Lead not found");
		}

		// 2. Lead ma'lumotlaridan yangi Student yaratish
		const student = await tx.students.create({
			data: {
				full_name: lead.full_name,
				phone: lead.phone,
				status: "ACTIVE",
			},
		});

		// 3. Studentni Enrollment (guruh)ga qo'shish
		await tx.enrollments.create({
			data: {
				student_id: student.id,
				group_id: parseInt(group_id),
				status: "ACTIVE",
				joined_at: new Date(),
			},
		});

		// 4. Lead statusini o'zgartirish
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

async function deleteById(id) {
	return await prisma.leads.update({
		where: { id: parseInt(id) },
		data: { status: "DELETED" },
	});
}

export default { create, getAll, getById, update, convert, deleteById };
