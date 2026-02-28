import prisma from "../lib/prisma.js";

async function get() {
	return await prisma.salary.findMany({
		where: { status: "ACTIVE" },
		include: {
			worker: {
				select: {
               phone: true,
               position: true,
               full_name: true,
				},
			},
		},
	});
}

async function create(data) {
	const worker = await prisma.workers.findUnique({
		where: { id: data.worker_id },
		include: { user: true },
	});

	if (!worker)
		throw {
			message: "Xodim topilmadi",
			statusCode: 404,
		};
	const newSalary = await prisma.salary.create({
		data: {
			worker_id: data.worker_id,
			amount: parseFloat(data.amount),
			method: data.method || "cash",
			description: data.description || null,
			month: data.month || new Date().toISOString().slice(0, 7), // "2024-01"
		},
		include: {
			worker: {
				select: {
					phone: true,
					position: true,
					full_name: true,
				},
			},
		},
	});
	return newSalary;
}

async function update(data) {
	return await prisma.salary.update({
		where: { id: parseInt(data.id) },
		data: {
			worker_id: data.worker_id,
			amount: data.amount,
			method: data.method,
			description: data.description,
			month: data.month || new Date().toISOString().slice(0, 7), // "2024-01"
		},
	});
}

async function deleteById(id) {
	return await prisma.salary.update({
		where: { id: parseInt(id) },
		data: { status: "DELETED" },
	});
}

export default { get, create, update, deleteById };
