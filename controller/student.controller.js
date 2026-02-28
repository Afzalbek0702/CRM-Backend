import studentService from "../services/student.service.js";
import { sendSuccess, sendError } from "../lib/response.js";

export async function getAllStudents(req, res) {
	try {
		const rows = await studentService.getAll();
		sendSuccess(res, rows);
	} catch (error) {
		sendError(
			res,
			error.message || "O'quvchilarni olishda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function getSingleStudent(req, res) {
	if (!req.params.id) {
		return sendError(res, "ID kerak", 400);
	}
	try {
		const student = await studentService.getById(req.params.id);
		sendSuccess(res, student);
	} catch (error) {
		sendError(
			res,
			error.message || "O'quvchini olishda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function createStudent(req, res) {
	const { full_name, phone, birthday, parents_name, parents_phone } = req.body;
	if (!full_name || !phone)
		return sendError(
			res,
			"Barcha maydonlar to'la bo'lishi shart! full_name, phone",
			400,
		);

	try {
		const newStudent = await studentService.create({
			full_name,
			phone,
			birthday,
			parents_name,
			parents_phone,
		});
		sendSuccess(res, newStudent, 201);
	} catch (error) {
		sendError(res, "O'quvchini qo'shishda xatolik yuz berdi", 500, error);
	}
}
export async function updateStudent(req, res) {
	if (!req.params.id) {
		return sendError(res, "ID kerak", 400);
	}
	const { full_name, phone, birthday, parents_name } = req.body;
	if (!full_name || !phone) {
		return sendError(
			res,
			"full_name, phone kerak",
			400,
		);
	}
	try {
		const updatedStudent = await studentService.update(req.params.id, {
			full_name,
			phone,
			birthday,
			parents_name,
		});
		if (!updatedStudent) {
			return sendError(res, "O'quvchi topilmadi", 404);
		}
		sendSuccess(res, updatedStudent);
	} catch (error) {
		sendError(
			res,
			error.message || "O'quvchini yangilashda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function updateStudentStatus(req, res) {
	const { status } = req.body;
	if (!req.params.id || !status) {
		return sendError(res, "ID va status kerak", 400);
	}
	// const allowed = ["active", "frozen", "finished", "debtor"];
	// if (!allowed.includes(status)) {
	// 	return sendError(res, "Noto‘g‘ri status", 400);
	// }
	try {
		const student = await studentService.updateStatus(
			req.params.id,
			status.toUpperCase(),
		);
		sendSuccess(res, student);
	} catch (error) {
		sendError(
			res,
			error.message || "O'quvchini yangilashda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function deleteStudent(req, res) {
	if (!req.params.id) {
		return sendError(res, "ID kerak", 400);
	}
	try {
		const removeStudent = await studentService.softDelete(req.params.id);
		sendSuccess(res, removeStudent);
	} catch (error) {
		sendError(
			res,
			error.message || "O'quvchini o'chirishda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function getStudentProfile(req, res) {
	const { id } = req.params;

	if (!id) return sendError(res, "ID kerak", 400);

	try {
		const profile = await studentService.getStudentProfile(id);
		if (!profile) return sendError(res, "O'quvchi topilmadi", 404);
		sendSuccess(res, profile);
	} catch (error) {
		sendError(
			res,
			error.message || "O'quvchi profilini olishda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function transferStudent(req, res) {
	const { student_id, from_group_id, to_group_id } = req.body;

	if (!student_id || !from_group_id || !to_group_id) {
		return sendError(
			res,
			"student_id, from_group_id va to_group_id kerak",
			400,
		);
	}
	try {
		const data = await studentService.transferStudent({
			student_id,
			from_group_id,
			to_group_id,
		});
		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			error.message || "O'quvchini ko'chirishda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function removeStudentFromGroup(req, res) {
	const studentId = req.params.id;
	const { groupId } = req.body;

	if (!groupId || isNaN(groupId) || !studentId) {
		return sendError(
			res,
			"groupId yoki studentId kerak va to'g'ri formatda bo'lishi kerak!",
			400,
		);
	}
	try {
		const data = await studentService.removeStudentFromGroup(
			studentId,
			groupId,
		);
		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			error.message || "O'quvchini guruhdan o'chirishda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
