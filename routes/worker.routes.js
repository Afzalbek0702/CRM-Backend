import express from "express";
import * as workerController from "../controller/worker.controller.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", requireRole("ADMIN"), workerController.getUsers);
router.put("/:id", requireRole("ADMIN"), workerController.update);
router.patch(
	"/:id/role",
	requireRole("ADMIN"),
	workerController.updateUserRole,
);
router.delete("/:id", requireRole("ADMIN"), workerController.deleteUser);

export default router;
