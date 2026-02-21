import expensesRepo from "../repositories/expensesRepo.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getAll(req, res) {
	try {
		const data = await expensesRepo.getAll();
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Xarajatlarni olishda xatolik yuz berdi", 500, error);
	}
}
export async function create(req, res) {
	const { description, amount, method, created_by } = req.body;
	if (!description || !amount || !method || !created_by)
		return sendError(res, "Barcha maydonlar to'la bo'lishi shart");
	try {
		await expensesRepo.create({ description, amount, method, created_by });
		sendSuccess(res, { message: "Xarajat yaratildi" }, 201);
	} catch (error) {
		sendError(res, "Xarajatni yaratishda xatolik yuz berdi", 500, error);
	}
}
export async function update(req, res) {
	const { description, amount, method, created_by } = req.body;
	if (!description || !amount || !method || !created_by || !req.params.id)
		return sendError(res, "Barcha maydonlar to'la bo'lishi shart");
	try {
		await expensesRepo.update({
			description,
			amount,
			method,
			created_by,
			id: req.params.id,
		});
		sendSuccess(res, { message: "Xarajat yangilandi" });
	} catch (error) {
		sendError(res, "Xarajatni yangilashda xatolik yuz berdi", 500, error);
	}
}
export async function deleteById(req, res) {
	if (!req.params.id) return sendError(res, "Id Topilmadi", 400);
	try {
		await expensesRepo.deleteByid(req.params.id);
		sendSuccess(res, { message: "Xarajat o'chirildi" });
	} catch (error) {
		sendError(res, "Xarajatni o'chirishda xatolik yuz berdi", 500, error);
	}
}
