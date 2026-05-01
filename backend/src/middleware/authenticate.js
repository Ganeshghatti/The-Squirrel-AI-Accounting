import { User } from "../models/User.js";

const HEADER = "x-api-key";

export async function authenticate(req, res, next) {
  try {
    const key = req.get(HEADER);
    if (!key) {
      return res.status(401).json({ error: "Missing API key (header: X-API-Key)" });
    }

    const user = await User.findOne({ apiKey: key, deletedAt: null }).select("+apiKey");
    if (!user) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}
