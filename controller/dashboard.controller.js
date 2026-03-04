import dashboardService from "../services/dashboard.service.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getDashboardData(req, res) {
	const { from, to, month } = req.query;
	if (!from || !to || !month)
		return sendError(
			res,
			"Barcha parametrlar bo'lishi kerak! from, to, month",
			400,
		);
	try {
		const monthlyIncome = await dashboardService.MonthlyIncome(
			from,
			to,
			req.tenantId,
		);
		const topDebtors = await dashboardService.TopDebtors(month, req.tenantId);
		const todayLessons = await dashboardService.TodayLessons(req.tenantId);
		const absentStudents = await dashboardService.AbsentStudents(req.tenantId);
		sendSuccess(res, {
			monthlyIncome,
			topDebtors,
			todayLessons,
			absentStudents,
		});
	} catch (error) {
		sendError(res, "Server xatosi", 500, error);
	}
}
