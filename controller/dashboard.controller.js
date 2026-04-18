import dashboardService from "../services/dashboard.service.js";
import { sendError, sendSuccess } from "../lib/response.js";

export async function getDashboardData(req, res) {
	try {
		const monthlyIncome = await dashboardService.MonthlyIncome(req.tenantId);
		const absentStudents = await dashboardService.AbsentStudents(req.tenantId);
		const todayLessons = await dashboardService.TodayLessons(req.tenantId);
		const debtAnalysis = await dashboardService.GetDebtAnalysis(req.tenantId);
		const studentAndGroupData = await dashboardService.GetDashboardStats(
			req.tenantId,
		);
		sendSuccess(res, {
			monthlyIncome,
			todayLessons,
			absentStudents,
			debtAnalysis,
			studentAndGroupData,
		});
	} catch (error) {
		sendError(res, "Server xatosi", 500, error);
	}
}
