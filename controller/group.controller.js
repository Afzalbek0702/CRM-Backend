import groupService from "../services/group.service.js";
import { sendSuccess, sendError } from "../lib/response.js";

export async function getAllGroups(req, res) {
	try {
		const groups = await groupService.getAll(req.tenantId, req.user);
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
		return sendError(
			res,
			"Barcha maydonlar to'ldirilishi kerak! name, course_type, price, lesson_time,	lesson_days, teacher_id,room_id,",
			400,
		);
	}
	try {

		const newGroup = await groupService.create({
			name,
			course_type,
			price,
			lesson_time,
			lesson_days,
			teacher_id,
			room_id,
			tenant_id: req.tenantId,
		});
		sendSuccess(res, newGroup, 201);
	} catch (error) {
		sendError(
			res,
			error.message || "Guruh yaratishda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function getSingleGroup(req, res) {
	if (!req.params.id) return sendError(res, "Guruh ID si ko'rsatilmagan", 400);
	try {
		const group = await groupService.getById(req.params.id, req.tenantId, req.user);
		sendSuccess(res, group);
	} catch (error) {
		sendError(
			res,
			error.message || "Guruhni olishda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function getStudentsInGroup(req, res) {
	if (!req.params.id) return sendError(res, "Guruh ID si ko'rsatilmagan", 400);
	try {
		const students = await groupService.getStudentInGroup(
			req.params.id,
			req.tenantId,
		);
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
		return sendError(
			res,
			"Barcha maydonlar to'ldirilishi kerak! name, course_type, price, lesson_time,	lesson_days, teacher_id, room_id",
			400,
		);
	}
	try {
		const updatedGroup = await groupService.update(req.params.id, {
			name,
			course_type,
			price,
			lesson_time,
			lesson_days,
			teacher_id,
			tenant_id: req.tenantId,
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
		const result = await groupService.deleteById(req.params.id, req.tenantId);
		sendSuccess(res, result);
	} catch (error) {
		sendError(res, "Guruhni o'chirishda xatolik yuz berdi", 500, error);
	}
}
