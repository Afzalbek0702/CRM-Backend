import { Router } from "express";
import * as enrollmentController from "../controller/enrollment.controller.js";
const router = Router();

router.get(
	"/",
	requireRole("CEO", "ADMIN", "MANAGER"),
	enrollmentController.getAllEnrollments,
);
router.post(
	"/",
	requireRole("CEO", "ADMIN", "MANAGER"),
	enrollmentController.createEnrollment,
);

export default router;
