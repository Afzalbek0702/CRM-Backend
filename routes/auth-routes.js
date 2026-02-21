import {Router} from 'express';
import * as authController from '../controller/auth-controller.js';
import { authMiddleware } from "../lib/authMiddleware.js";
import { requireRole } from "../lib/roleMiddleware.js";
const router = Router();
router.post('/login', authController.login);
router.post('/change-password', authMiddleware, requireRole("admin"), authController.changePassword);
router.post('/register', authMiddleware, requireRole('admin'), authController.registerWorker);
export default router;