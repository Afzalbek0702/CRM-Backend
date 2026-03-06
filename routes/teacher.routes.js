import { Router } from "express";
import * as teachersController from "../controller/teacher.controller.js";
import { requireRole } from "../middleware/roleMiddleware.js";
const router = Router();

router.get(
	"/",
	requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"),
	teachersController.getAllTeachers,
);
router.get(
	"/:id",
	requireRole("CEO", "ADMIN"),
	teachersController.getTeacherById,
);
router.put(
	"/:id",
	requireRole("CEO", "ADMIN"),
	teachersController.updateTeacher,
);
router.delete(
	"/:id",
	requireRole("CEO", "ADMIN"),
	teachersController.deleteTeacher,
);
export default router;
