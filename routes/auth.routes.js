import { Router } from "express";
import * as authController from "../controller/auth.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { tenantMiddleware } from "../middleware/tenenatMiddleware.js";
const router = Router();
router.post("/login", authController.login);
router.post(
	"/change-password",
	authMiddleware,
	requireRole("CEO", "ADMIN"),
	authController.changePassword,
);
router.post(
	"/register",
	authMiddleware,
	requireRole("CEO", "ADMIN"),
	authController.registerWorker,
);
router.get("/me", authMiddleware, authController.me);
export default router;