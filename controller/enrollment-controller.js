import { sendError, sendSuccess } from "../lib/response.js";
import { create, get } from "../repositories/enrollmentRepo.js";

export async function getAllEnrollments(req, res) {
	try {
		const data = await get();
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Enrollmentsni olishda xatolik yuz berdi", 500, error);
	}
}
export async function createEnrollment(req, res) {
	const { student_id, group_id } = req.body;
	if (!student_id || !group_id)
		return sendError(res, "student_id va group_id majburiy");

	try {
		const data = await create(student_id, group_id);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Enrollment qo'shishda xatolik yuz berdi", 500, error);
	}
}
