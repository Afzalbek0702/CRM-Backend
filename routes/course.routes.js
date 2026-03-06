import { Router } from "express";
import * as courseController from "../controller/course.controller.js";
import { requireRole } from "../middleware/roleMiddleware.js";
const router = Router();
router.get(
	"/",
	requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"),
	courseController.getAll,
);
router.post(
	"/",
	requireRole("CEO", "ADMIN", "MANAGER",),
	courseController.create,
);
router.put(
	"/:id",
	requireRole("CEO", "ADMIN", "MANAGER",),
	courseController.update,
);
router.delete(
	"/:id",
	requireRole("CEO", "ADMIN", "MANAGER",),
	courseController.deleteById,
);

export default router;