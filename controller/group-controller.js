import groupRepo from "../repositories/groupRepo.js";
import { sendSuccess, sendError } from "../lib/response.js";

export async function getAllGroups(req, res) {
	try {
		const groups = await groupRepo.getAll();
		sendSuccess(res, groups);
	} catch (error) {
		sendError(res, "Guruhlarni olishda xatolik yuz berdi", 500, error);
	}
}
export async function createGroup(req, res) {
	const {
		name,
		course_type,
		price,
		lesson_time,
		lesson_days,
		teacher_id,
		room_id,
	} = req.body;
	if (
		!name ||
		!course_type ||
		!price ||
		!lesson_time ||
		!lesson_days ||
		!teacher_id ||
		!room_id
	) {
		return sendError(res, "Barcha maydonlar to'ldirilishi kerak", 400);
	}
	try {
		const roomConflict = await groupRepo.chekRoom(
			room_id,
			lesson_days,
			lesson_time,
		);
		if (roomConflict.rows.length > 0)
			return sendError(
				res,
				"Bu vaqtda xona band. Iltimos, boshqa xona yoki vaqt tanlang.",
				400,
			);

		const newGroup = await groupRepo.create({
			name,
			course_type,
			price,
			lesson_time,
			lesson_days,
			teacher_id,
			room_id,
		});
		sendSuccess(res, newGroup, 201);
	} catch (error) {
		sendError(res, "Guruh yaratishda xatolik yuz berdi", 500, error);
	}
}
export async function getSingleGroup(req, res) {
	if (!req.params.id) return sendError(res, "Guruh ID si ko'rsatilmagan", 400);
	try {
		const group = await groupRepo.getById(req.params.id);
		if (!group) {
			return sendError(res, "Guruh topilmadi", 404);
		}
		sendSuccess(res, group);
	} catch (error) {
		sendError(res, "Guruhni olishda xatolik yuz berdi", 500, error);
	}
}
export async function getStudentsInGroup(req, res) {
	if (!req.params.id) return sendError(res, "Guruh ID si ko'rsatilmagan", 400);
	try {
		const students = await groupRepo.getStudentInGroup(req.params.id);
		sendSuccess(res, students);
	} catch (error) {
		sendError(res, "O'quvchilarni olishda xatolik yuz berdi", 500, error);
	}
}
export async function updateGroup(req, res) {
	const { name, course_type, price, lesson_time, lesson_days, teacher_id } =
		req.body;
	if (
		!name ||
		!course_type ||
		!price ||
		!lesson_time ||
		!lesson_days ||
		!teacher_id
	) {
		return sendError(res, "Barcha maydonlar to'ldirilishi kerak", 400);
	}
	try {
		const updatedGroup = await groupRepo.update(req.params.id, {
			name,
			course_type,
			price,
			lesson_time,
			lesson_days,
			teacher_id,
		});
		sendSuccess(res, updatedGroup);
	} catch (error) {
		sendError(res, "Guruhni yangilashda xatolik yuz berdi", 500, error);
	}
}
export async function deleteGroup(req, res) {
	if (!req.params.id) {
		return sendError(res, "Guruh ID si ko'rsatilmagan", 400);
	}
	try {
		const result = await groupRepo.deleteById(req.params.id);
		sendSuccess(res, result);
	} catch (error) {
		sendError(res, "Guruhni o'chirishda xatolik yuz berdi", 500, error);
	}
}
