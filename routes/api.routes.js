import { Router } from "express";
import groupsRouter from "./group.routes.js";
import studentsRouter from "./student.routes.js";
import teachersRouter from "./teacher.routes.js";
import enrollmentsRoutes from "./enrollment.routes.js";
import paymentsRoutes from "./payment.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import workerRoutes from "./worker.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import leadsRoutes from "./lead.routes.js";
import archiveRoutes from "./archive.routes.js";
import roomRoutes from "./room.routes.js";
import expenseRoutes from "./expense.routes.js";
import salaryRouters from "./salary.routes.js";
import courseRouters from "./course.routes.js";
import { requireRole } from "../middleware/roleMiddleware.js";
const router = Router();

router.use("/worker", requireRole("CEO", "ADMIN"), workerRoutes);
router.use("/teachers", requireRole("CEO", "ADMIN"), teachersRouter);
router.use("/salary", requireRole("CEO", "ADMIN"), salaryRouters);

router.use("/groups",requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"),	groupsRouter);
router.use(	"/students",requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"),studentsRouter);
router.use("/course", requireRole("CEO", "ADMIN", "MANAGER"), courseRouters);

router.use("/enrollment",	requireRole("CEO", "ADMIN", "MANAGER"),enrollmentsRoutes);
router.use("/payments", requireRole("CEO", "ADMIN", "MANAGER"), paymentsRoutes);
router.use("/attendance", requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"), attendanceRoutes);

router.use("/dashboard",requireRole("CEO", "ADMIN", "MANAGER"),dashboardRoutes);
router.use("/leads", requireRole("CEO", "ADMIN", "MANAGER"), leadsRoutes);
router.use("/archive", requireRole("CEO", "ADMIN"), archiveRoutes);
router.use("/room", requireRole("CEO", "ADMIN"), roomRoutes);
router.use("/expense", requireRole("CEO", "ADMIN", "MANAGER"), expenseRoutes);

export default router;