import archiveRepo from "../repositories/archiveRepo.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getAllArchivedPayments(req, res) {
	try {
		const data = archiveRepo.getPayments();
		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			"Arxivlangan to'lovlarni olishda xatolik yuz berdi",
			500,
			error,
		);
	}
}
export async function getAllArchivedLeads(req, res) {
	try {
		const data = archiveRepo.getLeads();
		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			"Arxivlangan leadlarni olishda xatolik yuz berdi",
			500,
			error,
		);
	}
}
export async function getAllArchivedGroups(req, res) {
	try {
		const data = archiveRepo.getGroups();
		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			"Arxivlangan guruhlarni olishda xatolik yuz berdi",
			500,
			error,
		);
	}
}
export async function getArchivedGroupById(req, res) {
	const { id } = req.params;
	if (!id) return sendError(res, "Id not found!", 404);
	try {
		const data = archiveRepo.getGroupById(id);
		if (data.length === 0)
			return sendError(res, "Arxivlangan guruh topilmadi", 404);
		sendSuccess(res, data);
	} catch (error) {
		res
			.status(500)
			.json({ msg: "Arxivlangan guruhni olishda xatolik yuz berdi", error });
	}
}
export async function getAllArchivedGroupsStudents(req, res) {
	try {
		const data = archiveRepo.getGroupsStudents();
		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			"Arxivlangan guruh o'quvchilarini olishda xatolik yuz berdi",
			500,
			error,
		);
	}
}
export async function getAllArchivedStudents(req, res) {
	try {
		const data = archiveRepo.getStudents();
		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			"Arxivlangan o'quvchilarni olishda xatolik yuz berdi",
			500,
			error,
		);
	}
}
