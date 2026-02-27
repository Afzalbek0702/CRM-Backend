import teacherService from "../services/teacher.service.js";
import { sendSuccess, sendError } from "../lib/response.js";

export async function getAllTeachers(req, res) {
	try {
		const teachers = await teacherService.getAll();
		sendSuccess(res, teachers);
	} catch (error) {
		sendError(res, "O'qituvchilarni olishda xatolik yuz berdi", 500, error);
	}
}
export async function createTeacher(req, res) {
	const { full_name, phone } = req.body;
	if (!full_name || !phone) {
		return sendError(res, "To'liq ma'lumot kiriting", 400);
	}
	try {
		const newTeacher = await teacherService.create({ full_name, phone });
		sendSuccess(res, newTeacher, 201);
	} catch (error) {
		sendError(
			res,
			error.message || "O'qituvchilarni qo'shishda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function getTeacherById(req, res) {
	if (!req.params.id) {
		return sendError(res, "ID kiriting", 400);
	}
	try {
		const teacher = await teacherService.getById(req.params.id);
		sendSuccess(res, teacher);
	} catch (error) {
		sendError(
			res,
			error.message || "O'qituvchini olishda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function updateTeacher(req, res) {
	if (!req.params.id) return sendError(res, "ID kiriting", 400);
	const { full_name, phone } = req.body;
	if (!full_name || !phone)
		return sendError(res, "To'liq ma'lumot kiriting!  full_name, phone", 400);
	try {
		const data = await teacherService.update(req.params.id, { full_name, phone });
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "O'qituvchilarni yangilashda xatolik yuz berdi", 500, error);
	}
}
export async function deleteTeacher(req, res) {
	if (!req.params.id) return sendError(res, "ID kiriting", 400);
	try {
		const data = await teacherService.deleteById(req.params.id);
		sendSuccess(res,data);
	} catch (error) {
		sendError(res, "O'qituvchini o'chirishda xatolik yuz berdi", 500, error);
	}
}
