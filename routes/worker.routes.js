import express from "express";
import * as workerController from "../controller/worker.controller.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", requireRole("CEO", "ADMIN"), workerController.getUsers);
router.put("/:id", requireRole("CEO", "ADMIN"), workerController.update);
router.patch(
	"/:id/role",
	requireRole("CEO", "ADMIN"),
	workerController.updateUserRole,
);
router.delete("/:id", requireRole("CEO", "ADMIN"), workerController.deleteUser);

export default router;
