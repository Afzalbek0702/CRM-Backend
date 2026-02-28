import { Router } from "express";
import * as paymentController from "../controller/payment.controller.js";
import { requireRole } from "../middleware/roleMiddleware.js";
const router = Router();

router.get("/", paymentController.getAllPayments);
router.post(
	"/",
	requireRole("ADMIN", "MANAGER"),
	paymentController.createPayment,
);
router.get("/:id", paymentController.getPaymentById);
router.put(
	"/:id",
	requireRole("ADMIN", "MANAGER"),
	paymentController.updatePayment,
);
router.delete("/:id", requireRole("ADMIN"), paymentController.deletePayment);
export default router;
