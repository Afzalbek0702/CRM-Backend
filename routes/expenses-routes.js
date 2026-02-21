import { Router } from "express";
import * as expensesController from "../controller/expense-controller.js";
const router = Router();
router.get("/", expensesController.getAll);
router.post("/", expensesController.create);
router.put("/:id", expensesController.update);
router.delete("/:id", expensesController.deleteById);
export default router;
