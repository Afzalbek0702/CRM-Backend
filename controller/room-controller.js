import roomRepo from "../repositories/roomRepo.js";
import { sendError, sendSuccess } from "../lib/response.js";
export async function getAll(req, res) {
	try {
		const data = await roomRepo.get();
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Xonalarni olishda xatolik yuz berdi!", 500, error);
	}
}
export async function getById(req, res) {
	if (!req.params.id) return sendError(res, "Id topilmadi", 400);
	try {
		const data = await roomRepo.getById(req.params.id);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Xonani olishda xatolik yuz berdi!", 500, error);
	}
}

export async function create(req, res) {
	const { name, capacity } = req.body;
	if (!name || !capacity)
		return sendError(res, "Xona nomi yoki sig'imi kerak!", 400);
	try {
		const data = await roomRepo.create(name, capacity);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Xona yaratishda xatolik yuz berdi!", 500, error);
	}
}
export async function update(req, res) {
	const { name, capacity } = req.body;
	if (!name || !capacity || !req.params.id)
		return sendError(res, "Xona nomi yoki id yoki sig'imi kerak");
	try {
		const data = await roomRepo.update(name, capacity, req.params.id);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Xonani yangilashda xatolik yuz berdi");
	}
}
export async function deleteById(req, res) {
	if (!req.params.id) return sendError(res, "Xona id si kerak");
	try {
		const data = await roomRepo.deleteById(req.params.id);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Xonani o'chirishda xatolik yuz berdi");
	}
}
