import courseRepo from "../repositories/courseRepo.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getAll(req, res) {
	try {
		const data = await courseRepo.get();
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Kurslarni olishda xatolik yus berdi", 500, error);
	}
}
export async function create(req, res) {
	const { name, price, lesson_count } = req.body;
	if (!name || !price || !lesson_count)
		return sendError(res, "barcha maydonlar to'la bo'lishi kerak", 400);
	try {
		await courseRepo.create(name, price, lesson_count);
		sendSuccess(res, { message: "Kurs yaratildi" }, 201);
	} catch (error) {
		sendError(res, "Kurslarni yaratishda xatolik yus berdi", 500, error);
	}
}
export async function update(req, res) {
	const { name, price, lesson_count } = req.body;
	if (!name || !price || !lesson_count || !req.params.id)
		return sendError(res, "barcha maydonlar to'la bo'lishi kerak", 400);
	try {
		await courseRepo.update({ name, price, lesson_count, id: req.params.id });
		sendSuccess(res, { message: "Kurs yangilandi" });
	} catch (error) {
		sendError(res, "Kurslarni yangilashda xatolik yus berdi", 500, error);
	}
}
export async function deleteById(req, res) {
	if (!req.params.id) return sendError(res, "ID kerak", 400);
	try {
		await courseRepo.deleteById(req.params.id);
		sendSuccess(res, { message: "Kurs o'chirildi" });
	} catch (error) {
		sendError(res, "Kurslarni yangilashda xatolik yus berdi", 500, error);
	}
}
