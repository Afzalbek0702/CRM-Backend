import prisma from "../lib/prisma.js";

export async function get() {
	return await prisma.enrollments.findMany({
		where: {
			status: "ACTIVE",
		},
	});
}

export async function create(student_id, group_id) {
	return await prisma.enrollments.create({
		data: {
			student_id: parseInt(student_id),
			group_id: parseInt(group_id),
		},
	});
}
