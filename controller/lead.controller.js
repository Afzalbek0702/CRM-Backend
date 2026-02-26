import leadsService from "../services/lead.service.js";
import { sendSuccess, sendError } from "../lib/response.js";

export async function createLead(req, res) {
	try {
		const { full_name, phone, source, interested_course, comment } = req.body;
		if (!full_name || !phone || !source || !interested_course || !comment)
			return sendError(
				res,
				"Barcha maydonlar to'la bo'lishi shart! full_name, phone, source, interested_course, comment",
				400,
			);
		const leads = await leadsService.create({
			full_name,
			phone,
			source,
			interested_course,
			comment,
		});
		sendSuccess(res, leads, 201);
	} catch (error) {
		sendError(res, "Lead ni yaratishda xatolik yuz berdi", 500, error);
	}
}
export async function getLeads(req, res) {
	try {
		const leads = await leadsService.getAll();
		sendSuccess(res, leads);
	} catch (error) {
		sendError(res, "Leadlarni olishda xatolik yuz berdi", 500, error);
	}
}
export async function getLeadById(req, res) {
	if (!req.params.id) return sendError(res, "ID topilmadi!", 404);
	try {
		const lead = await leadsService.getById(req.params.id);
		sendSuccess(res, lead);
	} catch (error) {
		sendError(res, "Leadni olishda xatolik yuz berdi", 500, error);
	}
}
export async function updateLead(req, res) {
	const { full_name, phone } = req.body;
	if (!full_name || !phone)
		return sendError(
			res,
			"Barcha maydonlar to'ldirilishi kerak! full_name, phone",
			400,
		);
	if (!req.params.id) return sendError(res, "ID required!", 404);
	try {
	 const leads =	await leadsService.update({
			full_name,
			phone,
			id: req.params.id,
		});
		sendSuccess(res, leads);
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
		const leads = await leadsService.convert(leadId, group_id);
		sendSuccess(res, leads);
	} catch (err) {
		sendError(res, "Conversion failed", 500, err);
	}
}
export async function deleteLead(req, res) {
	const leadId = req.params.id;
	try {
		const leads = await leadsService.deleteById(leadId);
		sendSuccess(res, leads);
	} catch (error) {
		sendError(res, "Failed to delete lead", 500, error);
	}
}