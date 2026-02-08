import teacherRepo from "../repositories/teacherRepo.js";
import { sendSuccess, sendError } from "../lib/response.js";

export async function getAllTeachers(req, res) {
	try {
		const teachers = await teacherRepo.getAll();
		sendSuccess(res, teachers, "O'qituvchilar muvaffaqiyatli olindi", 200);
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
		const newTeacher = await teacherRepo.create({ full_name, phone });
		sendSuccess(res, newTeacher, "O'qituvchi muvaffaqiyatli qo'shildi", 201);
	} catch (error) {
		sendError(res, "O'qituvchilarni qo'shishda xatolik yuz berdi", 500, error);
	}
}
export async function getTeacherById(req, res) {
	if (!req.params.id) {
		return sendError(res, "ID kiriting", 401);
	}
	try {
		const teacher = await teacherRepo.getById(req.params.id);
		sendSuccess(res, teacher, "O'qituvchi muvaffaqiyatli olindi", 200);
	} catch (error) {
		sendError(res, "O'qituvchini olishda xatolik yuz berdi", 500, error);
	}
}
export async function updateTeacher(req, res) {
	if (!req.params.id) return sendError(res, "ID kiriting", 401);
	const { full_name, phone } = req.body;
	if (!full_name || !phone)
		return sendError(res, "To'liq ma'lumot kiriting", 400);
	try {
		await teacherRepo.update(req.params.id, { full_name, phone });
		sendSuccess(res, null, "O'qituvchi muvaffaqiyatli yangilandi", 200);
	} catch (error) {
		sendError(res, "O'qituvchilarni yangilashda xatolik yuz berdi", 500, error);
	}
}
export async function deleteTeacher(req, res) {
	if (!req.params.id) return sendError(res, "ID kiriting", 401);
	try {
		await teacherRepo.deleteById(req.params.id);
		sendSuccess(res, null, "O'qituvchi muvaffaqiyatli o'chirildi", 200);
	} catch (error) {
		sendError(res, "O'qituvchini o'chirishda xatolik yuz berdi", 500, error);
	}
}
