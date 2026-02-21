import { Router } from "express";
import * as courseController from "../controller/courses-controller.js";
const router = Router();
router.get("/", courseController.getAll);
router.post("/", courseController.create);
router.put("/:id", courseController.update);
router.delete("/:id", courseController.deleteById);

export default router;