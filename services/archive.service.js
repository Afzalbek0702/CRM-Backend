import prisma from "../lib/prisma.js";

async function getPayments(tenant_id) {
	const payments = await prisma.payments.findMany({
		where: {
			tenant_id,
			status: "DELETED",
		},
		include: {
			students: { select: { full_name: true } },
			groups: { select: { name: true } },
		},
		orderBy: { paid_at: "desc" },
	});

	return payments.map(p => ({
		...p,
		student_name: p.students?.full_name,
		group_name: p.groups?.name,
	}));
}

async function getLeads(tenant_id) {
	return await prisma.leads.findMany({
		where: { status: "DELETED", tenant_id },
		orderBy: { created_at: "desc" },
	});
}

async function getGroups(tenant_id) {
	return await prisma.groups.findMany({
		where: { status: "ARCHIVED", tenant_id },
		orderBy: { created_at: "desc" },
	});
}

async function getGroupById(id, tenant_id) {
	return await prisma.groups.findMany({
		where: {
			id: parseInt(id),
			status: "ARCHIVED",
			tenant_id,
		},
	});
}

async function getGroupsStudents(tenant_id) {
	const enrollments = await prisma.enrollments.findMany({
		where: { status: "ARCHIVED", tenant_id },
		include: {
			students: { select: { full_name: true } },
			groups: { select: { name: true } },
		},
		orderBy: { archived_at: "desc" },
	});

	return enrollments.map(e => ({
		id: e.id,
		student_name: e.students?.full_name,
		group_name: e.groups?.name,
		archived_at: e.archived_at,
	}));
}

async function getStudents(tenant_id) {
	const student = await prisma.students.findMany({
		where: { status: "DELETED", tenant_id },
		include: {
			enrollments: {
				include: { groups: { select: { id: true, name: true, price: true } } },
			},
		},
		orderBy: { created_at: "desc" },
	});
   return student.map(s => {
      const enrollment = s.enrollments[0];
		return {
			id: s.id,
			full_name: s.full_name,
			phone: s.phone,
			balance: s.balance,
			created_at: s.created_at,
			birthday: s.birthday,
			parents_name: s.parents_name,
			parents_phone: s.parents_phone,
			deleted_at: s.deleted_at,
			last_billed_at: s.last_billed_at,
			groups: enrollment
				? { id: enrollment.groups.id, name: enrollment.groups.name }
				: null,
		};
	});
}

async function getTeachers(tenant_id) {
	return await prisma.teachers.findMany({
		where: { status: "DELETED", tenant_id },
	});
}

export default {
	getGroupById,
	getGroups,
	getGroupsStudents,
	getLeads,
	getPayments,
	getStudents,
	getTeachers,
};
