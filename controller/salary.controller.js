import salaryService from "../services/salary.service.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getAll(req, res) {
	try {
		const data = await salaryService.get();
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Salary ni olishda hatolik yuz berdi", 500, error);
	}
}
export async function create(req, res) {
	const { full_name, amount, method, description } = req.body;
	if (!full_name || !amount || !method || !description)
		return sendError(
			res,
			"Barcha maydonlar tola bo'lishi shart! full_name, amount, method, description",
			400,
		);
	try {
		const data = await salaryService.create({ full_name, amount, method, description });
		sendSuccess(res, data, 201);
	} catch (error) {
		sendError(res, "Salary ni yaratishda hatolik yuz berdi", 500, error);
	}
}
export async function update(req, res) {
	const { full_name, amount, method, description } = req.body;
	if (!full_name || !amount || !method || !description || !req.params.id)
		return sendError(
			res,
			"Barcha maydonlar tola bo'lishi shart! full_name, amount, method, description",
			400,
		);
	try {
		const data = await salaryService.update({
			full_name,
			amount,
			method,
			description,
			id: req.params.id,
		});
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Salary ni yangilashda hatolik yuz berdi", 500, error);
	}
}
export async function deleteByid(req, res) {
	if (!req.params.id) return sendError(res, "Id bo'lishi shart", 400);
	try {
	 const data = await salaryService.deleteById(req.params.id);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Salary ni yangilashda hatolik yuz berdi", 500, error);
	}
}
