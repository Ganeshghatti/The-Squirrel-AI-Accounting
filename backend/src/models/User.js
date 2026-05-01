import crypto from "crypto";
import mongoose from "mongoose";

const ROLES = ["user", "admin"];

function generateApiKey() {
  return `ak_${crypto.randomBytes(24).toString("hex")}`;
}

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    apiKey: { type: String, required: true, unique: true, select: false },
    role: { type: String, enum: ROLES, default: "user" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.statics.generateApiKey = generateApiKey;

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.apiKey;
  return obj;
};

export const User = mongoose.model("User", userSchema);
export { ROLES };
