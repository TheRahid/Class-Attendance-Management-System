import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Teacher from "../models/TeacherSchema.js";

function createToken(account) {
  return jwt.sign(
    { id: account.id, role: account.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function safeAccount(account) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    department: account.department,
    role: account.role,
    status: account.status,
  };
}

export async function registerTeacher(req, res) {
  try {
    const { name, email, password, department } = req.body;

    if (!name?.trim() || !email?.trim() || !password || !department?.trim()) {
      return res.status(400).json({
        message: "Name, email, department, and password are required.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (await Teacher.exists({ email: normalizedEmail })) {
      return res.status(409).json({
        message: "An account already uses this email.",
      });
    }

    const account = await Teacher.create({
      name: name.trim(),
      email: normalizedEmail,
      department: department.trim(),
      role: "teacher",
      status: "pending",
      passwordHash: await bcrypt.hash(password, 10),
    });

    return res.status(201).json({
      message:
        "Registration received. An admin must approve your account before you can log in.",
      account: safeAccount(account),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account already uses this email.",
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Could not register the teacher.",
    });
  }
}

export async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    const account = await Teacher.findOne({
      email: email?.toLowerCase().trim(),
    }).select("+passwordHash");

    if (!account || !(await bcrypt.compare(password || "", account.passwordHash))) {
      return res.status(401).json({
        message: "Email or password is incorrect.",
      });
    }

    if (role && account.role !== role) {
      return res.status(403).json({
        message: `This account is registered as a ${account.role}.`,
      });
    }

    if (account.status === "pending") {
      return res.status(403).json({
        message: "Your account is waiting for admin approval.",
      });
    }

    if (account.status === "suspended") {
      return res.status(403).json({
        message: "This account is suspended. Contact the administrator.",
      });
    }

    return res.json({
      token: createToken(account),
      account: safeAccount(account),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Could not log in." });
  }
}

export function getCurrentAccount(req, res) {
  return res.json({ account: safeAccount(req.account) });
}