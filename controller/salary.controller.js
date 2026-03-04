import salaryService from "../services/salary.service.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getAll(req, res) {
	try {
		const data = await salaryService.get(req.tenantId);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Salary ni olishda hatolik yuz berdi", 500, error);
	}
}
export async function create(req, res) {
	const { amount, method, description, worker_id, month } = req.body;
	if (!amount || !method || !description || !worker_id || !month)
		return sendError(
			res,
			"Barcha maydonlar tola bo'lishi shart! amount, method, description, worker_id,month",
			400,
		);
	try {
		const data = await salaryService.create({
			amount,
			method,
			description,
			worker_id,
			tenant_id: req.tenantId,
		});
		sendSuccess(res, data, 201);
	} catch (error) {
		sendError(res, "Salary ni yaratishda hatolik yuz berdi", 500, error);
	}
}
export async function update(req, res) {
	const { amount, method, description, worker_id, month } = req.body;
	if (!amount || !method || !description || !req.params.id)
		return sendError(
			res,
			"Barcha maydonlar tola bo'lishi shart! amount, method, description",
			400,
		);
	try {
		const data = await salaryService.update({
			amount,
			method,
			description,
			worker_id,
			month,
			id: req.params.id,
			tenant_id: req.tenantId,
		});
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Salary ni yangilashda hatolik yuz berdi", 500, error);
	}
}
export async function deleteByid(req, res) {
	if (!req.params.id) return sendError(res, "Id bo'lishi shart", 400);
	try {
		const data = await salaryService.deleteById(req.params.id, req.tenantId);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Salary ni yangilashda hatolik yuz berdi", 500, error);
	}
}
