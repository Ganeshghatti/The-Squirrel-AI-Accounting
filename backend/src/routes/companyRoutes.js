import { Router } from "express";
import {
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  connectMailbox,
  disconnectMailbox,
} from "../controllers/companyController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

router.use(authenticate);

router.get("/", listCompanies);
router.post("/", createCompany);
router.post("/:id/mailboxes", connectMailbox);
router.delete("/:id/mailboxes/:mailboxId", disconnectMailbox);
router.get("/:id", getCompany);
router.patch("/:id", updateCompany);
router.delete("/:id", deleteCompany);

export default router;
