import { Router } from "express";
import * as paymentController from "../controller/payment.controller.js";
import { requireRole } from "../middleware/roleMiddleware.js";
const router = Router();

router.get(
	"/",
	requireRole("CEO", "ADMIN", "MANAGER","TEACHER"),
	paymentController.getAllPayments,
);
router.get(
	"/debtors",
	requireRole("CEO", "ADMIN", "MANAGER"),
	paymentController.TopDebtors,
);
router.post(
	"/",
	requireRole("CEO", "ADMIN", "MANAGER"),
	paymentController.createPayment,
);
router.get(
	"/:id",
	requireRole("CEO", "ADMIN", "MANAGER"),
	paymentController.getPaymentById,
);
router.put(
	"/:id",
	requireRole("CEO", "ADMIN", "MANAGER"),
	paymentController.updatePayment,
);
router.delete(
	"/:id",
	requireRole("CEO", "ADMIN"),
	paymentController.deletePayment,
);
export default router;
