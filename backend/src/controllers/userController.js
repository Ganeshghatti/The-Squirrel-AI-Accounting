import { User } from "../models/User.js";

export async function listUsers(req, res, next) {
  try {
    const users = await User.find({ deletedAt: null }).sort({ createdAt: -1 }).lean();
    res.json(users);
  } catch (e) {
    next(e);
  }
}

export async function getUser(req, res, next) {
  try {
    const user = await User.findOne({ _id: req.params.id, deletedAt: null }).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (e) {
    next(e);
  }
}

export async function createUser(req, res, next) {
  try {
    const { email, name, phone, role } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "email and name are required" });
    }
    const apiKey = User.generateApiKey();
    const user = await User.create({
      email,
      name,
      phone: phone ?? "",
      apiKey,
      role: role === "admin" ? "admin" : "user",
    });
    const doc = user.toObject();
    doc.apiKey = apiKey;
    res.status(201).json(doc);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: "Email or API key conflict" });
    }
    next(e);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { email, name, phone, role } = req.body;
    const user = await User.findOne({ _id: req.params.id, deletedAt: null });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (email !== undefined) user.email = email;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role !== undefined) user.role = role === "admin" ? "admin" : "user";
    await user.save();
    res.json(user);
  } catch (e) {
    if (e.code === 11000) {
      return res.status(409).json({ error: "Email conflict" });
    }
    next(e);
  }
}

export async function softDeleteUser(req, res, next) {
  try {
    const user = await User.findOne({ _id: req.params.id, deletedAt: null });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    user.deletedAt = new Date();
    await user.save();
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
