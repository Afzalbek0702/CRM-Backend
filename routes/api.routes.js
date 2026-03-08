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

router.use("/groups",requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"),	groupsRouter);
router.use("/students",requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"),studentsRouter);

router.use("/dashboard",requireRole("CEO", "ADMIN", "MANAGER"),dashboardRoutes);
router.use("/leads", requireRole("CEO", "ADMIN", "MANAGER"), leadsRoutes);
router.use("/expense", requireRole("CEO", "ADMIN", "MANAGER"), expenseRoutes);

router.use("/worker", requireRole("CEO", "ADMIN"), workerRoutes);
router.use("/archive", requireRole("CEO"), archiveRoutes);
router.use("/salary", requireRole("CEO", "ADMIN"), salaryRouters);

router.use("/teachers", teachersRouter);
router.use("/course", courseRouters,);
router.use("/enrollment", enrollmentsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/room", roomRoutes);

export default router;