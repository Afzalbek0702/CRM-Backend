import { Router } from "express";
import groupsRouter from "./groups-routes.js";
import studentsRouter from "./students-routes.js";
import teachersRouter from "./teachers-routes.js";
import enrollmentsRoutes from "./enrollment-routes.js";
import paymentsRoutes from "./payments-routes.js";
import attendanceRoutes from "./attendance-routes.js";
import userRoutes from "./user-routes.js";
import dashboardRoutes from "./dashboard-routes.js";
import leadsRoutes from "./leads-routes.js";
import archiveRoutes from "./archive-routes.js";
const router = Router();

router.use("/groups", groupsRouter);
router.use("/users", userRoutes);
router.use("/students", studentsRouter);
router.use("/teachers", teachersRouter);
router.use("/enrollments", enrollmentsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/leads", leadsRoutes)
router.use("/archive", archiveRoutes)

export default router;