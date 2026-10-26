import jwt from "jsonwebtoken";
import Teacher from "../models/TeacherSchema.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return res.status(401).json({ message: "Please log in." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const account = await Teacher.findById(payload.id);

    if (!account || account.status !== "active") {
      return res.status(401).json({ message: "Account is unavailable." });
    }

    req.account = account;
    next();
  } catch {
    return res.status(401).json({
      message: "Session expired. Please log in again.",
    });
  }
}

export function requireAdmin(req, res, next) {
  if (req.account?.role !== "admin") {
    return res.status(403).json({ message: "Admin access is required." });
  }

  next();
}