import prisma from "../lib/prisma.js";

async function get(tenant_id) {
	const today = new Date().toLocaleDateString("en-US", { weekday: "short" });

	const rooms = await prisma.rooms.findMany({
		where: { tenant_id: tenant_id, status: "ACTIVE" },
		include: {
			groups: {
				where: {
					lesson_days: {
						has: today,
					},
				},
				orderBy: {
					lesson_time: "asc",
				},
			},
		},
		orderBy: {
			name: "asc",
		},
	});

	return rooms.flatMap((r) => {
		const groupsToProcess = r.groups.length > 0 ? r.groups : [null];
		return groupsToProcess.map((g) => ({
			room_id: r.id,
			room_name: r.name,
			capacity: r.capacity,
			status: r.status,
			group_name: g?.name ?? null,
			group_id: g?.id ?? null,
			group_lesson_time: g?.lesson_time ?? null,
			group_lesson_days: g?.lesson_days ?? null,
		}));
	});
}

async function getById(id, tenant_id) {
	const today = new Date().toLocaleDateString("en-US", { weekday: "short" });

	const r = await prisma.rooms.findUnique({
		where: { tenant_id: tenant_id, id: parseInt(id) },
		include: {
			groups: {
				where: {
					lesson_days: { has: today },
				},
				orderBy: { lesson_time: "asc" },
			},
		},
	});

	if (!r) throw { message: "Xona topilmadi", statusCode: 404 };

	// Agar guruhlar bo'lmasa, faqat xonani qaytaramiz
	if (r.groups.length === 0)
		return {
			room_id: r.id,
			room_name: r.name,
			capacity: r.capacity,
			status: r.status,
			group_name: null,
		};

	return r.groups.map((g) => ({
		room_id: r.id,
		room_name: r.name,
		capacity: r.capacity,
		status: r.status,
		group_name: g.name,
		lesson_time: g.lesson_time,
		lesson_days: g.lesson_days,
	}));
}

async function create(name, capacity, tenant_id) {
	const room = await prisma.rooms.create({
		data: { name, capacity: parseInt(capacity), tenant_id },
	});
	return [room];
}

async function update(name, capacity, id, tenant_id) {
	const updatedRoom = await prisma.rooms.update({
		where: { tenant_id: tenant_id, id: parseInt(id) },
		data: { name, capacity: parseInt(capacity) },
	});
	return [updatedRoom];
}

async function deleteById(id, tenant_id) {
	const archivedRoom = await prisma.rooms.update({
		where: { tenant_id: tenant_id, id: parseInt(id) },
		data: { status: "ARCHIVED" },
	});
	return [archivedRoom];
}

export default { create, get, getById, deleteById, update };
