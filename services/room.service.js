import prisma from "../lib/prisma.js";

async function get(tenant_id) {
	const now = new Date();
	// Bugun haftaning qaysi kuni (Mon, Tue, Wed...)
	const today = now.toLocaleDateString("en-US", { weekday: "short" });
	// Hozirgi soat va daqiqa (HH:mm formatida, masalan "14:30")
	const currentTime =
		now.getHours().toString().padStart(2, "0") +
		":" +
		now.getMinutes().toString().padStart(2, "0");

	try {
		const rooms = await prisma.rooms.findMany({
			where: {
				tenant_id: tenant_id,
				status: "ACTIVE",
			},
			include: {
				groups: {
					where: {
						lesson_days: { has: today },
						status: "ACTIVE",
					},
					orderBy: { lesson_time: "asc" },
				},
			},
		});

		return rooms.map((room) => {
			const todayGroups = room.groups;

			const currentLesson = todayGroups.find((g) => {
				const lessonStart = g.lesson_time;
				const [h, m] = lessonStart.split(":").map(Number);
				const startMinutes = h * 60 + m;
				const nowMinutes = now.getHours() * 60 + now.getMinutes();

				return nowMinutes >= startMinutes && nowMinutes < startMinutes + 90;
         });

			const nextLesson = todayGroups.find((g) => g.lesson_time > currentTime);

			return {
				room_id: room.id,
				room_name: room.name,
				capacity: room.capacity,
				today_lessons_count: todayGroups.length,
				is_currently_busy: !!currentLesson,
				current_group: currentLesson ? currentLesson.name : null,
				next_lesson_time: nextLesson
					? nextLesson.lesson_time
					: "Bugun boshqa dars yo'q",
				daily_schedule: todayGroups.map((g) => ({
					group_id: g.id,
					group_name: g.name,
					time: g.lesson_time,
				})),
			};
		});
	} catch (error) {
		console.error("Room Status Error:", error);
		throw error;
	}
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
