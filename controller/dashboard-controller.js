import dashboardRepo from "../repositories/dashboardRepo.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getMonthlyIncome(req, res) {
	const { from, to } = req.query;
	if (!from || !to) return sendError(res, "Query not found!", 401);
	try {
		const data = await dashboardRepo.MonthlyIncome(from, to);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Internal server error", 500, error);
	}
}
export async function getTopDebtors(req, res) {
	const { month } = req.query;
	if (!month) return sendError(res, "month not found!", 401);
	try {
		const data = await dashboardRepo.TopDebtors(month);
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "Internal server error", 500, error);
	}
}
export async function getTodayLessons(req, res) {
	try {
		const data = await dashboardRepo.TodayLessons();
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "internal server error", 500, error);
	}
}
export async function getAbsentStudents(req, res) {
	try {
		const data = await dashboardRepo.AbsentStudents();
		sendSuccess(res, data);
	} catch (error) {
		sendError(res, "internal server error", 500, error);
	}
}
