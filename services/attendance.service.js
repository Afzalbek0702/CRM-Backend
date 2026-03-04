import prisma from "../lib/prisma.js";

async function getMonthlyAttendance(groupId, startDate, endDate, tenant_id) {
	return await prisma.attendance.findMany({
		where: {
			group_id: parseInt(groupId),
			tenant_id: tenant_id,
			lesson_date: {
				gte: new Date(startDate),
				lte: new Date(endDate),
			},
		},
	});
}

async function getGroupDetails(groupId, tenant_id) {
	return await prisma.groups.findUnique({
		where: { id: parseInt(groupId), tenant_id: tenant_id },
		select: { lesson_days: true },
	});
}

async function getStudentsInGroup(groupId, tenant_id) {
	return await prisma.students.findMany({
      where: {
         tenant_id: tenant_id,
			status: "ACTIVE",
			enrollments: {
				some: { group_id: parseInt(groupId), status: "ACTIVE" },
			},
		},
		select: { id: true, full_name: true },
		orderBy: { full_name: "asc" },
	});
}

async function set(data) {
	return await prisma.attendance.upsert({
		where: {
			tenant_id: data.tenant_id,
			group_id_student_id_lesson_date: {
				group_id: parseInt(data.group_id),
				student_id: parseInt(data.student_id),
				lesson_date: new Date(data.lesson_date),
			},
		},
		update: { status: data.status },
		create: {
			group_id: parseInt(data.group_id),
			student_id: parseInt(data.student_id),
			lesson_date: new Date(data.lesson_date),
			status: data.status,
			tenant_id: data.tenant_id,
		},
	});
}

export default {
	getMonthlyAttendance,
	getGroupDetails,
	getStudentsInGroup,
	set,
};
