import salaryRepo from "../repositories/salaryRepo.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getAll(req, res) {
	try {
		const data = await salaryRepo.get();
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Salary ni olishda hatolik yuz berdi", 500, error);
	}
}
export async function create(req, res) {
	const { full_name, amount, method, description } = req.body;
	if (!full_name || !amount || !method || !description)
		return sendError(res, "Barcha maydonlar tola bo'lishi shart", 400);
	try {
		await salaryRepo.create({ full_name, amount, method, description });
		sendSuccess(res, { message: "Salary yaratildi" }, 201);
	} catch (error) {
		sendError(res, "Salary ni yaratishda hatolik yuz berdi", 500, error);
	}
}
export async function update(req, res) {
	const { full_name, amount, method, description } = req.body;
	if (!full_name || !amount || !method || !description || !req.params.id)
		return sendError(res, "Barcha maydonlar tola bo'lishi shart", 400);
	try {
		await salaryRepo.update({
			full_name,
			amount,
			method,
			description,
			id: req.params.id,
		});
		sendSuccess(res, { message: "Salary yangilandi" });
	} catch (error) {
		sendError(res, "Salary ni yangilashda hatolik yuz berdi", 500, error);
	}
}
export async function deleteByid(req, res) {
	if (!req.params.id) return sendError(res, "Id bo'lishi shart", 400);
	try {
		await salaryRepo.deleteById(req.params.id);
		sendSuccess(res, "Salary o'chirildi");
	} catch (error) {
		sendError(res, "Salary ni yangilashda hatolik yuz berdi", 500, error);
	}
}
