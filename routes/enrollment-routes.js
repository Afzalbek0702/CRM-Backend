import { Router } from "express";
import * as enrollmentController from "../controller/enrollment-controller.js";
const router = Router();

router.get("/", enrollmentController.getAllEnrollments);
router.post("/", enrollmentController.createEnrollment);

export default router;