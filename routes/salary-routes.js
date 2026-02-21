import { Router } from "express";
import * as salaryController from "../controller/salary-controller.js";
const router = Router();

router.get("/", salaryController.getAll);
router.post("/", salaryController.create);
router.put("/:id", salaryController.update);
router.delete("/:id", salaryController.deleteByid);
export default router