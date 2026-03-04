import prisma from "../lib/prisma.js";

async function getAll(tenant_id) {
	return await prisma.teachers.findMany({
		where: { tenant_id: tenant_id, status: "DELETED" },
	});
}

async function getById(id, tenant_id) {
	const teacher = await prisma.teachers.findUnique({
		where: {tenant_id:tenant_id, id: parseInt(id) },
		select: {
			id: true,
			full_name: true,
			phone: true,
			worker: {
				select: {
					id: true,
					position: true,
					salary: true,
					salary_type: true,
					birthday: true,
					img: true,
					hired_at: true,
					status: true,
				},
			},
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
		position: teacher.worker.position,
		salary: teacher.worker.salary,
		salary_type: teacher.worker.salary_type,
		hired_at: teacher.worker.hired_at,
		status: teacher.worker.status,
		groups: teacher.groups.map((g) => ({
			id: g.id,
			name: g.name,
			price: g.price,
			course_type: g.course_type,
			students: g.enrollments.map((e) => e.students).flat(),
		})),
	};
}

async function update(data) {
	const { full_name, phone, position, salary, id, tenant_id } = data;

	const result = await prisma.$transaction(async (tx) => {
		// 1. Teacher ni update
		const teacher = await tx.teachers.update({
			where: {tenant_id:tenant_id, id: parseInt(id) },
			data: {
				full_name,
				phone,
			},
		});

		// 2. Worker ni update
		const worker = await tx.workers.update({
			where: { id: teacher.workerId },
			data: {
				full_name,
				phone,
				position,
				salary,
			},
		});
		const user = await tx.users.update({
			where: { id: worker.user_id },
			data: {
				phone,
			},
		});
		return { teacher, worker, user };
	});

	return result;
}

async function deleteById(id, tenant_id) {
	return await prisma.teachers.update({
		where: {tenant_id:tenant_id, id: parseInt(id) },
		data: { status: "DELETED" },
	});
}

export default {
	getAll,
	getById,
	update,
	deleteById,
};
