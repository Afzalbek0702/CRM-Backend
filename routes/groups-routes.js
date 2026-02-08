import { Router } from "express";
import * as groupController from "../controller/group-controller.js";
const router = Router();

router.get("/", groupController.getAllGroups);
router.post("/", groupController.createGroup);
router.get("/:id", groupController.getSingleGroup);
router.get("/:id/students", groupController.getStudentsInGroup);
router.put("/:id", groupController.updateGroup);
router.delete("/:id", groupController.deleteGroup);
export default router;