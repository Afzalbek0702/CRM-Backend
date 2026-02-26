import { Router } from "express";
import * as paymentController from "../controller/payment.controller.js";
import { requireRole } from "../middleware/roleMiddleware.js";
const router = Router();

router.get("/", paymentController.getAllPayments);
router.post(
	"/",
	requireRole("admin", "manager"),
	paymentController.createPayment,
);
router.get("/:id", paymentController.getPaymentById);
router.put(
	"/:id",
	requireRole("admin", "manager"),
	paymentController.updatePayment,
);
router.delete("/:id", requireRole("admin"), paymentController.deletePayment);
export default router;
