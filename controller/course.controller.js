import courseService from "../services/course.service.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getAll(req, res) {
	try {
		const data = await courseService.get(req.tenantId);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Kurslarni olishda xatolik yus berdi", 500, error);
	}
}
export async function create(req, res) {
	const { name, price, lesson_count } = req.body;
	if (!name || !price || !lesson_count)
		return sendError(
			res,
			"Barcha maydonlar to'la bo'lishi kerak!",
			400,
		);
	try {
		const data = await courseService.create(
			name,
			price,
			lesson_count,
			req.tenantId,
		);
		sendSuccess(res, data, 201);
	} catch (error) {
		sendError(res, "Kurslarni yaratishda xatolik yus berdi", 500, error);
	}
}
export async function update(req, res) {
	const { name, price, lesson_count } = req.body;
	if (!name || !price || !lesson_count || !req.params.id)
		return sendError(
			res,
			"Barcha maydonlar to'la bo'lishi kerak!",
			400,
		);
	try {
		const data = await courseService.update({
			name,
			price,
			lesson_count,
			id: req.params.id,
			tenant_id: req.tenantId,
		});
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Kurslarni yangilashda xatolik yus berdi", 500, error);
	}
}
export async function deleteById(req, res) {
	if (!req.params.id) return sendError(res, "ID kerak!", 400);
	try {
		const data = await courseService.deleteById(req.params.id, req.tenantId);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Kursni o'chirishda xatolik yus berdi", 500, error);
	}
}
