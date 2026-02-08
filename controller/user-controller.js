import userRepo from "../repositories/userRepo.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getUsers(req, res) {
	try {
		const users = await userRepo.getAll();
		sendSuccess(res, users, "Users retrieved successfully", 200);
	} catch (error) {
		sendError(res, "Failed to retrieve users", 500, error);
	}
}
export async function updateUserRole(req, res) {
	const { id } = req.params;
	const { role } = req.body;
	try {
		await userRepo.updateRole(id, role);
		sendSuccess(res, null, "User role updated successfully", 200);
	} catch (error) {
		sendError(res, "Failed to update user role", 500, error);
	}
}
export async function deleteUser(req, res) {
	const { id } = req.params;
	try {
		await userRepo.deleteById(id);
		sendSuccess(res, null, "User deleted successfully", 200);
	} catch (error) {
		sendError(res, "Failed to delete user", 500, error);
	}
}
