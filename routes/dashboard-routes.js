import { Router } from "express";
const router = Router();
import * as dashboardController from "../controller/dashboard-controller.js";
import { requireRole } from "../lib/roleMiddleware.js";

router.get("/", requireRole("admin"), dashboardController.getDashboardData);
export default router;