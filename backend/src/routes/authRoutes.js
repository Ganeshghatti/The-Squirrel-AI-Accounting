import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

/** Lightweight check that `X-API-Key` belongs to an active user (desktop login, etc.). */
router.get("/validate", authenticate, (_req, res) => {
  res.json({ ok: true });
});

export default router;
