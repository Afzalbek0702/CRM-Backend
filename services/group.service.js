import prisma from "../lib/prisma.js";
import { isTimeOverlap, parseLessonTime } from "../utils/time.js";

async function getAll() {
	const groups = await prisma.groups.findMany({
		where: { status: "ACTIVE" },
		include: {
			teachers: {
				select: { id: true, full_name: true },
			},
		},
	});

	return groups.map((g) => ({
		...g,
		teacher_id: g.teachers?.id,
		teacher: g.teachers?.full_name,
	}));
}

async function getById(id) {
	const group = await prisma.groups.findUnique({
		where: { id: parseInt(id) },
	});
	if (!group) throw { message: "Guruh topilmadi", statusCode: 404 };
	return group;
}

async function create(data) {
	const {
		name,
		course_type,
		price,
		lesson_time,
		lesson_days,
		teacher_id,
		room_id,
	} = data;
	const newTime = parseLessonTime(lesson_time);
	const existingGroups = await prisma.groups.findMany({
		where: {
			room_id: parseInt(room_id),
			lesson_days: {
				hasSome: lesson_days,
			},
		},
		select: {
			name: true,
			lesson_time: true,
		},
	});

	for (const group of existingGroups) {
		const existingTime = parseLessonTime(group.lesson_time);

		const overlap = isTimeOverlap(
			newTime.start,
			newTime.end,
			existingTime.start,
			existingTime.end,
		);

		if (overlap)
			throw {
				message: `Xona band: "${group.name}" (${group.lesson_time}) bilan vaqt to‘qnashdi`,
				statusCode: 409,
			};
	}
	return await prisma.groups.create({
		data: {
			name,
			course_type,
			price: parseFloat(price),
			lesson_time,
			lesson_days,
			teacher_id: parseInt(teacher_id),
			room_id: parseInt(room_id),
		},
	});
}

async function getStudentInGroup(id) {
	const enrollments = await prisma.enrollments.findMany({
		where: {
			group_id: parseInt(id),
			status: "ACTIVE",
			students: { status: "ACTIVE" },
		},
		include: {
			students: {
				select: {
					id: true,
					full_name: true,
					phone: true,
					birthday: true,
					parents_phone: true,
				},
			},
		},
	});

	return enrollments.map((e) => e.students);
}

async function update(id, data) {
	const { name, course_type, price, lesson_time, lesson_days, teacher_id } =
		data;
	return await prisma.groups.update({
		where: { id: parseInt(id) },
		data: {
			name,
			course_type,
			price: parseFloat(price),
			lesson_time,
			lesson_days,
			teacher_id: parseInt(teacher_id),
		},
	});
}

async function deleteById(id) {
	const groupId = parseInt(id);

	return await prisma.$transaction(async (tx) => {
		const group = await tx.groups.update({
			where: { id: groupId },
			data: { status: "ARCHIVED" },
		});

		const enrollments = await tx.enrollments.updateMany({
			where: { group_id: groupId, status: "ACTIVE" },
			data: {
				status: "FINISHED",
				end_date: new Date(),
			},
		});

		return {
			group,
			updatedEnrollments: enrollments,
			enrollmentCount: enrollments.count,
		};
	});
}

export default {
	getAll,
	getById,
	create,
	getStudentInGroup,
	update,
	deleteById,
};
