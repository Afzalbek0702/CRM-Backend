import { Router } from "express";
import * as studentController from "../controller/student-controller.js";
const router = Router();

router.get("/", studentController.getAllStudents);
router.get("/:id", studentController.getSingleStudent);
router.get("/:id/profile", studentController.getStudentProfile);
router.post("/", studentController.createStudent);
router.put("/:id", studentController.updateStudent);
router.patch("/:id/status", studentController.updateStudentStatus);
router.delete("/:id", studentController.deleteStudent);
router.post("/:id/transfer", studentController.transferStudent);
router.post("/:id/remove-from-group", studentController.removeStudentFromGroup);
export default router;