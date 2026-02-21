import dashboardRepo from "../repositories/dashboardRepo.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getDashboardData(req, res) {
	const { from, to, month } = req.query;
	if (!from || !to || !month) return sendError(res, "Query not found!", 400);
	try {
		const monthlyIncome = await dashboardRepo.MonthlyIncome(from, to);
		const topDebtors = await dashboardRepo.TopDebtors(month);
		const todayLessons = await dashboardRepo.TodayLessons();
		const absentStudents = await dashboardRepo.AbsentStudents();
		sendSuccess(res, {
			monthlyIncome,
			topDebtors,
			todayLessons,
			absentStudents,
		});
	} catch (error) {
		sendError(res, "internal server error", 500, error);
	}
}
