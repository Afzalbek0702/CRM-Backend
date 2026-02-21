import express from "express";
import * as workerController from "../controller/worker-controller.js";
import { requireRole } from "../lib/roleMiddleware.js";

const router = express.Router();

router.get("/", requireRole("admin"), workerController.getUsers);
router.put("/:id", requireRole("admin"), workerController.update);
router.patch("/:id/role", requireRole("admin"), workerController.updateUserRole);
router.delete("/:id", requireRole("admin"), workerController.deleteUser);

export default router;