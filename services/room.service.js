import prisma from "../lib/prisma.js";

async function get() {
	const today = new Date().toLocaleDateString("en-US", { weekday: "short" });

	const rooms = await prisma.rooms.findMany({
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
		if (r.groups.length === 0) {
			return [
            {
               room_id: r.id,
					room_name: r.name,
					capacity: r.capacity,
					status: r.status,
					group_name: null,
				},
			];
		}
		return r.groups.map((g) => ({
			room_name: r.name,
			capacity: r.capacity,
			status: r.status,
			group_name: g.name,
			lesson_time: g.lesson_time,
			lesson_days: g.lesson_days,
		}));
	});
}

async function getById(id) {
	const today = new Date().toLocaleDateString("en-US", { weekday: "short" });

	const r = await prisma.rooms.findUnique({
		where: { id: parseInt(id) },
		include: {
			groups: {
				where: {
					lesson_days: { has: today },
				},
				orderBy: { lesson_time: "asc" },
			},
		},
	});

	if (!r) return [];

	// Agar guruhlar bo'lmasa, faqat xonani qaytaramiz
	if (r.groups.length === 0) {
		return [
         {
            room_id: r.id,
				room_name: r.name,
				capacity: r.capacity,
				status: r.status,
				group_name: null,
			},
		];
	}

	return r.groups.map((g) => ({
		room_name: r.name,
		capacity: r.capacity,
		status: r.status,
		group_name: g.name,
		lesson_time: g.lesson_time,
		lesson_days: g.lesson_days,
	}));
}

async function create(name, capacity) {
	const room = await prisma.rooms.create({
		data: { name, capacity },
	});
	return [room];
}

async function update(name, capacity, id) {
	const updatedRoom = await prisma.rooms.update({
		where: { id: parseInt(id) },
		data: { name, capacity },
	});
	return [updatedRoom];
}

async function deleteById(id) {
	const archivedRoom = await prisma.rooms.update({
		where: { id: parseInt(id) },
		data: { status: "ARCHIVE" },
	});
	return [archivedRoom];
}

export default { create, get, getById, deleteById, update };