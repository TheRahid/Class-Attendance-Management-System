import { Router } from "express";
import {
  getCurrentAccount,
  login,
  registerTeacher,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerTeacher);
router.post("/login", login);
router.get("/me", requireAuth, getCurrentAccount);

export default router;