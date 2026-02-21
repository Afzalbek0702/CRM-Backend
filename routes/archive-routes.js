import { Router } from "express";
import * as ArchiveController from "../controller/archive-controller.js";
const router = Router();

router.get("/payments", ArchiveController.getAllArchivedPayments);
router.get("/leads", ArchiveController.getAllArchivedLeads);
router.get("/groups", ArchiveController.getAllArchivedGroups);
router.get("/groups/:id", ArchiveController.getArchivedGroupById);
router.get("/group-students", ArchiveController.getAllArchivedGroupsStudents);
router.get("/students", ArchiveController.getAllArchivedStudents);
router.get("/teachers", ArchiveController.getAllArchivedTeachers);
export default router;
