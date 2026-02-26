import prisma from "../lib/prisma.js";

async function getMonthlyAttendance(groupId, startDate, endDate) {
	// Bittada o'sha oydagi hamma davomatni olib kelamiz
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
// import prisma from "../lib/prisma.js";

// async function set(data) {
// 	const { group_id, student_id, lesson_date, status } = data;

// 	// ON CONFLICT mantiqi Prisma-da upsert deb ataladi
// 	return await prisma.attendance.upsert({
// 		where: {
// 			// Bu yerda schema.prisma-da @@unique([group_id, student_id, lesson_date]) bo'lishi kerak
// 			group_id_student_id_lesson_date: {
// 				group_id: parseInt(group_id),
// 				student_id: parseInt(student_id),
// 				lesson_date: new Date(lesson_date),
// 			},
// 		},
// 		update: { status },
// 		create: {
// 			group_id: parseInt(group_id),
// 			student_id: parseInt(student_id),
// 			lesson_date: new Date(lesson_date),
// 			status,
// 		},
// 	});
// }

// async function group(group_id) {
// 	const groupData = await prisma.groups.findUnique({
// 		where: {
// 			id: parseInt(group_id),
// 			status: "ACTIVE",
// 		},
// 		select: { lesson_days: true },
// 	});

// 	// pg formatiga moslash uchun obyekt qaytaramiz
// 	return { rows: groupData ? [groupData] : [], rowCount: groupData ? 1 : 0 };
// }

// async function student(group_id) {
// 	const students = await prisma.students.findMany({
// 		where: {
// 			status: "ACTIVE",
// 			enrollments: {
// 				some: {
// 					group_id: parseInt(group_id),
// 					status: "ACTIVE",
// 				},
// 			},
// 		},
// 		select: {
// 			id: true,
// 			full_name: true,
// 		},
// 		orderBy: { full_name: "asc" },
// 	});

// 	return { rows: students, rowCount: students.length };
// }

// async function attendance(student_id, group_id, dateStr) {
// 	const attendanceData = await prisma.attendance.findFirst({
// 		where: {
// 			student_id: parseInt(student_id),
// 			group_id: parseInt(group_id),
// 			lesson_date: new Date(dateStr),
// 		},
// 		select: { status: true },
// 	});

// 	return {
// 		rows: attendanceData ? [attendanceData] : [],
// 		rowCount: attendanceData ? 1 : 0,
// 	};
// }

// export default { attendance, group, set, student };
