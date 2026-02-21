import workerRepo from "../repositories/workerRepo.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getUsers(req, res) {
	try {
		const users = await workerRepo.getAll();
		sendSuccess(res, users);
	} catch (error) {
		sendError(res, "Failed to retrieve users", 500, error);
	}
}
export async function update(req, res) {
	const { full_name, phone, position, salary, birthday, img, user_id } =
		req.body;
	if (
		!full_name ||
		!phone ||
		!position ||
		!salary ||
		!birthday ||
		!req.params.id ||
		!user_id
	)
		return sendError(res, "Barcha maydonlar to'ldirilishi kerak", 400);
	try {
		await workerRepo.update({
			full_name,
			phone,
			position,
			salary,
			birthday,
			img,
			id: req.params.id,
			user_id,
		});
		sendSuccess(res, { message: "Worker Yangilandi" });
	} catch (error) {
		sendError(res, "Yangilashda xatolik yuz berdi", 500, error);
	}
}

export async function updateUserRole(req, res) {
	const { id } = req.params;
	const { role } = req.body;
	try {
		await workerRepo.updateRole(id, role);
		sendSuccess(res, { message: "User role updated successfully" });
	} catch (error) {
		sendError(res, "Failed to update user role", 500, error);
	}
}
export async function deleteUser(req, res) {
	const { id } = req.params;
	try {
		await workerRepo.deleteById(id);
		sendSuccess(res, { message: "User deleted successfully" });
	} catch (error) {
		sendError(res, "Failed to delete user", 500, error);
	}
}
