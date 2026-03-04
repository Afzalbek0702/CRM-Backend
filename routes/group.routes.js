import { Router } from "express";
import * as groupController from "../controller/group.controller.js";
import { requireRole } from "../middleware/roleMiddleware.js";
const router = Router();

router.get(
	"/",
	requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"),
	groupController.getAllGroups,
);
router.post(
	"/",
	requireRole("CEO", "ADMIN", "MANAGER"),
	groupController.createGroup,
);
router.get(
	"/:id",
	requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"),
	groupController.getSingleGroup,
);
router.get(
	"/:id/students",
	requireRole("CEO", "ADMIN", "MANAGER", "TEACHER"),
	groupController.getStudentsInGroup,
);
router.put(
	"/:id",
	requireRole("CEO", "ADMIN", "MANAGER"),
	groupController.updateGroup,
);
router.delete("/:id", requireRole("CEO", "ADMIN"), groupController.deleteGroup);
export default router;
