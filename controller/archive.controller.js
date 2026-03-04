import archiveService from "../services/archive.service.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getAllArchivedPayments(req, res) {
	try {
		const data = await archiveService.getPayments(req.tenantId);
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
		const data = await archiveService.getLeads(req.tenantId);
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
		const data = await archiveService.getGroups(req.tenantId);
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
	if (!id) return sendError(res, "Id topilmadi!", 404);
	try {
		const data = await archiveService.getGroupById(id, req.tenantId);
		if (data.length === 0)
			return sendError(res, "Arxivlangan guruh topilmadi", 404);
		sendSuccess(res, data);
	} catch (error) {
		res.status(500).json({
			message: "Arxivlangan guruhni olishda xatolik yuz berdi",
			error,
		});
	}
}
export async function getAllArchivedGroupsStudents(req, res) {
	try {
		const data = await archiveService.getGroupsStudents(req.tenantId);
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
		const data = await archiveService.getStudents(req.tenantId);
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
export async function getAllArchivedTeachers(req, res) {
	try {
		const data = await archiveService.getTeachers(req.tenantId);
		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			"Arxivlangan o'qituvchilarni olishda xatolik yuz berdi",
			500,
			error,
		);
	}
}
