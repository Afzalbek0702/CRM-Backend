import { Router } from "express";
import * as teachersController from "../controller/teachers-controller.js";
const router = Router();

router.get("/", teachersController.getAllTeachers);
router.get("/:id", teachersController.getTeacherById);
router.post("/", teachersController.createTeacher);
router.put("/:id", teachersController.updateTeacher);
router.delete("/:id", teachersController.deleteTeacher);
export default router;