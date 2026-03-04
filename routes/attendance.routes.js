import { Router } from "express";
import * as AttendanceController from "../controller/attendance.controller.js";
import { requireRole } from "../middleware/roleMiddleware.js";
const router = Router();

router.get("/",requireRole("CEO", "ADMIN", "TEACHER"), AttendanceController.getAttendance);
router.post("/",requireRole("CEO", "ADMIN", "TEACHER"), AttendanceController.setAttendance);

export default router;