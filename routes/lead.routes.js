import { Router } from "express";
import * as LeadsController from "../controller/lead.controller.js";
const router = Router();

router.post("/", LeadsController.createLead);
router.get("/", LeadsController.getLeads);
router.post("/:id/convert-to-group", LeadsController.convertLeadToGroup);
router.post("/:id/convert-to-student", LeadsController.convertLeadToStudent);
router.get("/:id", LeadsController.getLeadById);
router.put("/:id", LeadsController.updateLead);
router.delete("/:id", LeadsController.deleteLead);
export default router;
