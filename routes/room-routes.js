import { Router } from "express";
import * as roomController from "../controller/room-controller.js";
const router = Router();
router.get("/", roomController.getAll);
router.get("/:id", roomController.getById);
router.post("/", roomController.create);
router.put("/", roomController.update);
router.delete("/", roomController.deleteById);
export default router;
