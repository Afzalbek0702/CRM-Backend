import express from "express";
import * as userController from "../controller/user-controller.js";
import { requireRole } from "../lib/roleMiddleware.js";

const router = express.Router();

router.get("/", requireRole("admin"), userController.getUsers);
router.patch("/:id/role", requireRole("admin"), userController.updateUserRole);
router.delete("/:id", requireRole("admin"), userController.deleteUser);

export default router;