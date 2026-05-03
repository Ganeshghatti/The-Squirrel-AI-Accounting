import mongoose from "mongoose";

const actionSchema = new mongoose.Schema({}, { strict: false, _id: false });

const emailResultSchema = new mongoose.Schema(
  {
    email_id: String,
    subject: String,
    sender: String,
    received_date: String,
    classification: {
      type: String,
      enum: ["invoice", "debit_note", "not_invoice", "duplicate", "needs_review"],
    },
    confidence: String,
    reason: String,
    preview: { type: Object, default: {} },
    // Agent 2 results — populated only for invoice / debit_note
    actions: { type: [actionSchema], default: [] },
    actionConfidence: String,
    actionWarnings: { type: [String], default: [] },
    actionErrors: { type: [String], default: [] },
    balance_check: { type: Object, default: null },
  },
  { _id: false }
);

const emailAnalysisSchema = new mongoose.Schema(
  {
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    mailboxId: mongoose.Schema.Types.ObjectId,
    fromDate: String,
    toDate: String,
    summary: { type: Object, default: {} },
    emailResults: { type: [emailResultSchema], default: [] },
  },
  { timestamps: true }
);

export const EmailAnalysis = mongoose.model("EmailAnalysis", emailAnalysisSchema);