import prisma from "../lib/prisma.js";

async function getMonthlyAttendance(groupId, startDate, endDate) {
	return await prisma.attendance.findMany({
		where: {
			group_id: parseInt(groupId),
			lesson_date: {
				gte: new Date(startDate),
				lte: new Date(endDate),
			},
		},
	});
}

async function getGroupDetails(groupId) {
	return await prisma.groups.findUnique({
		where: { id: parseInt(groupId) },
		select: { lesson_days: true },
	});
}

async function getStudentsInGroup(groupId) {
	return await prisma.students.findMany({
		where: {
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
		},
	});
}

export default {
	getMonthlyAttendance,
	getGroupDetails,
	getStudentsInGroup,
	set,
};