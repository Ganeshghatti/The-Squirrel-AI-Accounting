import mongoose from "mongoose";

/**
 * IMAP mailbox connection per provider (Gmail, Zoho, Yahoo, cPanel/Hostinger, etc.).
 * Passwords use select: false — use .select("+connectedMailboxes.password") only in trusted sync jobs.
 */
const imapMailboxSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: "" },
    emailAddress: { type: String, required: true, trim: true, lowercase: true },
    imapHost: { type: String, required: true, trim: true },
    imapPort: { type: Number, default: 993 },
    tls: { type: Boolean, default: true },
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true, select: false },
  },
  { _id: true }
);

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    desc: { type: String, trim: true, default: "" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deletedAt: { type: Date, default: null },
    connectedMailboxes: { type: [imapMailboxSchema], default: [] },
  },
  { timestamps: true }
);

companySchema.set("toJSON", {
  transform(_doc, ret) {
    if (Array.isArray(ret.connectedMailboxes)) {
      ret.connectedMailboxes = ret.connectedMailboxes.map((m) => {
        const { password: _omit, ...safe } = m;
        return safe;
      });
    }
    return ret;
  },
});

export const Company = mongoose.model("Company", companySchema);
