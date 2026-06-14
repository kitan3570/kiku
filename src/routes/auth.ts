import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/refresh
router.post("/refresh", refresh);

// POST /api/auth/logout
router.post("/logout", logout);

export default router;
