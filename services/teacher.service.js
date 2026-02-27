import prisma from "../lib/prisma.js";

async function getAll() {
	return await prisma.teachers.findMany();
}

async function getById(id) {
	const teacher = await prisma.teachers.findUnique({
		where: { id: parseInt(id) },
		select: {
			id: true,
			full_name: true,
			phone: true,
			groups: {
				select: {
					id: true,
					name: true,
					price: true,
					course_type: true,
					enrollments: {
						select: {
							students: {
								select: {
									id: true,
									full_name: true,
									phone: true,
								},
							},
						},
					},
				},
			},
		},
	});
	if (!teacher) throw { message: "Teacher not found", statusCode: 404 };

	return {
		id: teacher.id,
		full_name: teacher.full_name,
		phone: teacher.phone,
		groups: teacher.groups.map((g) => ({
			id: g.id,
			name: g.name,
			price: g.price,
			course_type: g.course_type,
			students: g.enrollments.map((e) => e.students).flat(),
		})),
	};
}

async function create(data) {
	const { full_name, phone } = data;
	const existingTeacher = await prisma.teachers.findFirst({
		where: { phone },
	});
	if (existingTeacher)
		throw { message: "O'qtivchi allaqachon mavjud", statusCode: 400 };
	return await prisma.teachers.create({
		data: { full_name, phone },
	});
}

async function update(id, data) {
	const { full_name, phone } = data;
	return await prisma.teachers.update({
		where: { id: parseInt(id) },
		data: {
			full_name,
			phone,
		},
	});
}

async function deleteById(id) {
	return await prisma.teachers.update({
		where: { id: parseInt(id) },
		data: { status: "DELETED" },
	});
}

export default {
	getAll,
	getById,
	create,
	update,
	deleteById,
};
