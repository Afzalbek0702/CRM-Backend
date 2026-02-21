import pool from "../lib/db.js";
import leadsRepo from "../repositories/leadsRepo.js";
import { sendSuccess, sendError } from "../lib/response.js";

export async function createLead(req, res) {
	try {
		const { full_name, phone, source, interested_course, comment } = req.body;
		if (!full_name || !phone || !source || !interested_course || !comment)
			return sendError(
				res,
				"Full name, phone, source, interested course, and comment are required",
				400,
			);
		await leadsRepo.create({
			full_name,
			phone,
			source,
			interested_course,
			comment,
		});
		sendSuccess(res, { message: "Lid muvaffaqiyatli yaratildi" }, 201);
	} catch (error) {
		sendError(res, "Failed to create lead", 500, error);
	}
}
export async function getLeads(req, res) {
	try {
		const leads = await leadsRepo.getAll();
		sendSuccess(res, leads);
	} catch (error) {
		sendError(res, "Failed to retrieve leads", 500, error);
	}
}
export async function getLeadById(req, res) {
	if (!req.params.id) return sendError(res, "ID required!", 404);
	try {
		const leads = await leadsRepo.getById(req.params.id);
		sendSuccess(res, leads);
	} catch (error) {
		sendError(res, "Failed to retrieve lead", 500, error);
	}
}
export async function updateLead(req, res) {
	const { full_name, phone } = req.body;
	if (!full_name || !phone)
		return sendError(res, "Full name, phone are required", 400);
	if (!req.params.id) return sendError(res, "ID required!", 404);
	try {
		await leadsRepo.update({
			full_name,
			phone,
			id: req.params.id,
		});
		sendSuccess(res, { message: "Lid muvaffaqiyatli yangilandi" });
	} catch (error) {
		sendError(res, "Failed to create lead", 500, error);
	}
}
export async function convertLeadToGroup(req, res) {
	const leadId = req.params.id;
	const { group_id } = req.body;

	if (!group_id) {
		return sendError(res, "Group ID is required for conversion", 400);
	}

	try {
		const data = await leadsRepo.convert(leadId, group_id);
		sendSuccess(res, data);
	} catch (err) {
		await pool.query("ROLLBACK");
		sendError(res, "Conversion failed", 500, err);
	}
}
export async function deleteLead(req, res) {
	const leadId = req.params.id;
	try {
		await leadsRepo.deleteById(leadId);
		sendSuccess(res, { message: "Lid muvaffaqiyatli o'chirildi" });
	} catch (error) {
		sendError(res, "Failed to delete lead", 500, error);
	}
}