import { Router } from "express";
const router = Router();
import * as dashboardController from "../controller/dashboard-controller.js";
import { requireRole } from "../lib/roleMiddleware.js";

// GET /api/dashboard/monthly-income?from=2025-08-01&to=2026-01-31
router.get(
	"/monthly-income",
	requireRole("admin", "manager"),
	dashboardController.getMonthlyIncome,
);
router.get(
	"/top-debtors",
	requireRole("admin", "manager"),
	dashboardController.getTopDebtors,
);
router.get(
	"/today-lessons",
	requireRole("admin", "manager"),
	dashboardController.getTodayLessons,
);
router.get(
	"/absent-students",
	requireRole("admin", "manager"),
	dashboardController.getAbsentStudents,
);
export default router;
