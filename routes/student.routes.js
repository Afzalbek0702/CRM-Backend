import { Router } from "express";
import * as studentController from "../controller/student.controller.js";
import { requireRole } from "../middleware/roleMiddleware.js";
const router = Router();

router.get(
	"/",
	requireRole("CEO", "ADMIN", "MANAGER","TEACHER"),
	studentController.getAllStudents,
);
router.get(
	"/:id",
	requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"),
	studentController.getSingleStudent,
);
router.get(
	"/:id/profile",
	requireRole("CEO", "ADMIN", "MANAGER"),
	studentController.getStudentProfile,
);
router.post(
	"/",
	requireRole("CEO", "ADMIN", "MANAGER"),
	studentController.createStudent,
);
router.put(
	"/:id",
	requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"),
	studentController.updateStudent,
);
router.patch("/:id/status",requireRole("CEO","ADMIN","MANAGER","TEACHER"), studentController.updateStudentStatus);
router.delete(
	"/:id",
	requireRole("CEO", "ADMIN", "MANAGER"),
	studentController.deleteStudent,
);
router.post(
	"/:id/transfer",
	requireRole("CEO", "ADMIN", "MANAGER"),
	studentController.transferStudent,
);
router.post(
	"/:id/remove-from-group",
	requireRole("CEO", "ADMIN", "MANAGER"),
	studentController.removeStudentFromGroup,
);
export default router;
