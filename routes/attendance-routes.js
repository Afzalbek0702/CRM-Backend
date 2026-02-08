import { Router } from "express";
import * as AttendanceController from "../controller/attendance-controller.js";
const router = Router();

router.get("/", AttendanceController.getAttendance);
router.post("/", AttendanceController.setAttendance);

export default router;