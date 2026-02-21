import pool from "../lib/db.js";
import studentRepo from "../repositories/studentRepo.js";
import { sendSuccess, sendError } from "../lib/response.js";

export async function getAllStudents(req, res) {
	try {
		const rows = await studentRepo.getAll();
		sendSuccess(res, rows);
	} catch (error) {
		sendError(res, "O'quvchilarni olishda xatolik yuz berdi", 500, error);
	}
}
export async function getSingleStudent(req, res) {
	if (!req.params.id) {
		return sendError(res, "ID kerak", 400);
	}
	try {
		const student = await studentRepo.getById(req.params.id);
		if (!student) {
			return sendError(res, "O'quvchi topilmadi", 404);
		}
		sendSuccess(res, student);
	} catch (error) {
		res
			.status(500)
			.json({ message: "O'quvchini olishda xatolik yuz berdi", error });
	}
}
export async function createStudent(req, res) {
	const { full_name, phone, birthday, parents_name, parents_phone } = req.body;
	if (!full_name || !phone || !birthday || !parents_name || !parents_phone) {
		return sendError(
			res,
			"full_name, phone, birthday, parents_name va parents_phone kerak",
			400,
		);
	}
	try {
		const newStudent = await studentRepo.create({
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
	if (!full_name || !phone || !birthday || !parents_name) {
		return sendError(
			res,
			"full_name, phone, birthday va parents_name kerak",
			400,
		);
	}
	try {
		const updatedStudent = await studentRepo.update(req.params.id, {
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
		sendError(res, "O'quvchini yangilashda xatolik yuz berdi", 500, error);
	}
}
export async function updateStudentStatus(req, res) {
	const { status } = req.body;
	if (!req.params.id || !status) {
		return sendError(res, "ID va status kerak", 400);
	}

	const allowed = ["active", "frozen", "finished", "debtor"];
	if (!allowed.includes(status)) {
		return sendError(res, "Noto‘g‘ri status", 400);
	}
	try {
		await studentRepo.updateStatus(req.params.id, status.toUpperCase());
		sendSuccess(res, { message: "O'quvchi statusi muvaffaqiyatli yangilandi" });
	} catch (error) {
		sendError(res, "O'quvchini yangilashda xatolik yuz berdi", 500, error);
	}
}
export async function deleteStudent(req, res) {
	if (!req.params.id) {
		return sendError(res, "ID kerak", 400);
	}
	try {
		await studentRepo.softDelete(req.params.id);
		sendSuccess(res, { message: "O'quvchi muvaffaqiyatli o'chirildi" });
	} catch (error) {
		sendError(res, "O'quvchini o'chirishda xatolik yuz berdi", 500, error);
	}
}
export async function getStudentProfile(req, res) {
	const { id } = req.params;

	if (!id) return sendError(res, "ID kerak", 400);

	try {
		const profile = await studentRepo.getStudentProfile(id);
		if (!profile) {
			return sendError(res, "O'quvchi topilmadi", 404);
		}
		sendSuccess(res, profile);
	} catch (error) {
		sendError(res, "O'quvchi profilini olishda xatolik yuz berdi", 500, error);
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
		await studentRepo.transferStudent({
			student_id,
			from_group_id,
			to_group_id,
		});
		sendSuccess(res, { message: "O'quvchi muvaffaqiyatli ko'chirildi" });
	} catch (error) {
		await pool.query("ROLLBACK");
		sendError(res, "O'quvchini ko'chirishda xatolik yuz berdi", 500, error);
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
		await studentRepo.removeStudentFromGroup(studentId, groupId);
		sendSuccess(res, {
			message: "O'quvchi muvaffaqiyatli guruhdan o'chirildi",
		});
	} catch (err) {
		await pool.query("ROLLBACK");
		sendError(
			res,
			"O'quvchini guruhdan o'chirishda xatolik yuz berdi",
			500,
			err,
		);
	}
}
