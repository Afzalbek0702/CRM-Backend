import roomService from "../services/room.service.js";
import { sendError, sendSuccess } from "../lib/response.js";
export async function getAll(req, res) {
	try {
		const data = await roomService.get();
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Xonalarni olishda xatolik yuz berdi!", 500, error);
	}
}
export async function getById(req, res) {
	if (!req.params.id) return sendError(res, "Id topilmadi", 400);
	try {
		const data = await roomService.getById(req.params.id);
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
		const data = await roomService.create(name, capacity);
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
		const data = await roomService.update(name, capacity, req.params.id);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Xonani yangilashda xatolik yuz berdi");
	}
}
export async function deleteById(req, res) {
	if (!req.params.id) return sendError(res, "Xona id si kerak");
	try {
		const data = await roomService.deleteById(req.params.id);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Xonani o'chirishda xatolik yuz berdi");
	}
}
