import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  softDeleteUser,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/", listUsers);
router.get("/:id", getUser);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", softDeleteUser);

export default router;
