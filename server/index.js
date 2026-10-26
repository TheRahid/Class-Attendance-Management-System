import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import Teacher from "./server/models/TeacherSchema.js";
import { connectDB } from "./server/config/db.js";
import authRoutes from "./server/routes/authRoute.js";
import teacherRoutes from "./server/routes/teachersRoute.js";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
}));
app.use(express.json());

app.get("/api", (_req, res) => {
  res.json({ message: "Attendance API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin/teachers", teacherRoutes);

async function createAdminIfMissing() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env");
  }

  const existing = await Teacher.findOne({ email });

  if (existing) {
    if (existing.role !== "admin") {
      throw new Error("ADMIN_EMAIL is already used by a teacher account.");
    }
    return;
  }

  await Teacher.create({
    name,
    email,
    department: "",
    role: "admin",
    status: "active",
    passwordHash: await bcrypt.hash(password, 10),
  });

  console.log(`Created admin account: ${email}`);
}

const port = process.env.PORT || 5000;

try {
  await connectDB();
  await createAdminIfMissing();

  app.listen(port, () => {
    console.log(`API running at http://localhost:${port}`);
  });
} catch (error) {
  console.error("Server startup failed:", error.message);
  process.exit(1);
}