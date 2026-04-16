import workerService from "../services/worker.service.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getUsers(req, res) {
	try {
		const data = await workerService.getAll(req.tenantId);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Failed to retrieve users", 500, error);
	}
}
export async function update(req, res) {
	const { id } = req.params;
	const body = req.body; // Barcha maydonlar shu yerda

	if (!id || !body.user_id) {
		return sendError(res, "ID va user_id bo'lishi shart!", 400);
	}

	try {
		const data = await workerService.update({
			...body,
			id: id,
			tenant_id: req.tenantId,
		});
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Yangilashda xatolik yuz berdi", 500, error.message);
	}
}

export async function updateUserRole(req, res) {
	const { id } = req.params;
	const { role } = req.body;
	try {
		const data = await workerService.updateRole(id, role, req.tenantId);
		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			error.message || "User role ni yangilashda xatolik yuz berdi",
			error.statusCode || 500,
			error,
		);
	}
}
export async function deleteUser(req, res) {
	const { id } = req.params;
	try {
		const data = await workerService.deleteById(id, req.tenantId);
		sendSuccess(res, data);
	} catch (error) {
		sendError(
			res,
			error.message || "Failed to delete user",
			error.statusCode || 500,
			error,
		);
	}
}
