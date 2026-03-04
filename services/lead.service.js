import prisma from "../lib/prisma.js";

async function create(data) {
	const { full_name, phone, source, interested_course, comment, tenant_id } =
		data;
	return await prisma.leads.create({
		data: { full_name, phone, source, interested_course, comment },
	});
}

async function getAll(tenant_id) {
	return await prisma.leads.findMany({
		where: {
			tenant_id: tenant_id,
			status: { not: "CONVERTED" },
			status: { not: "DELETED" },
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

async function convert(leadId, group_id, tenant_id) {
	return await prisma.$transaction(async (tx) => {
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
			},
		});

		await tx.enrollments.create({
			data: {
				student_id: student.id,
				group_id: parseInt(group_id),
				status: "ACTIVE",
				joined_at: new Date(),
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

export default { create, getAll, getById, update, convert, deleteById };
