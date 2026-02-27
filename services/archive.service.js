import prisma from "../lib/prisma.js";

async function getPayments() {
	const payments = await prisma.payments.findMany({
		where: { status: "DELETED" },
		include: {
			students: { select: { full_name: true } },
			groups: { select: { name: true } },
		},
		orderBy: { paid_at: "desc" },
	});

	return payments.map((p) => ({
		...p,
		student_name: p.students?.full_name,
		group_name: p.groups?.name,
	}));
}

async function getLeads() {
	return await prisma.leads.findMany({
		where: { status: "DELETED" },
		orderBy: { created_at: "desc" },
	});
}

async function getGroups() {
	return await prisma.groups.findMany({
		where: { status: "ARCHIVED" },
		orderBy: { created_at: "desc" },
	});
}

async function getGroupById(id) {
	return await prisma.groups.findMany({
		where: {
			id: parseInt(id),
			status: "ARCHIVED",
		},
	});
}

async function getGroupsStudents() {
	const enrollments = await prisma.enrollments.findMany({
		where: { status: "ARCHIVED" },
		include: {
			students: { select: { full_name: true } },
			groups: { select: { name: true } },
		},
		orderBy: { archived_at: "desc" },
	});

	return enrollments.map((e) => ({
		id: e.id,
		student_name: e.students?.full_name,
		group_name: e.groups?.name,
		archived_at: e.archived_at,
	}));
}

async function getStudents() {
	return await prisma.students.findMany({
		where: { status: "DELETED" },
		orderBy: { created_at: "desc" },
	});
}

async function getTeachers() {
	return await prisma.teachers.findMany({
		where: { status: "DELETED" },
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
