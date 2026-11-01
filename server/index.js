import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import Teacher from './models/TeacherSchema.js';
import Attendance from './models/AttendanceSchema.js';
import { connectDB } from './config/db.js';
import { migrateRosterBatches } from './config/migrateRosterBatches.js';
import authRoutes from './routes/authRoute.js';
import teacherRoutes from './routes/teachersRoute.js';
import { adminRouter as adminCourseRoutes, teacherRouter as teacherCourseRoutes } from './routes/courseRoute.js';
import adminAttendanceRoutes from './routes/attendanceRoute.js';
import adminRosterRoutes from './routes/rostersRoute.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json());
app.get('/api', (_req, res) => res.json({ message: 'Attendance API is running' }));
app.use('/api/auth', authRoutes);
app.use('/api/admin/teachers', teacherRoutes);
app.use('/api/admin/courses', adminCourseRoutes);
app.use('/api/teacher/courses', teacherCourseRoutes);
app.use('/api/admin/attendance', adminAttendanceRoutes);
app.use('/api/admin/rosters', adminRosterRoutes);

async function ensureAdminAccount() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in server/.env');
  }
  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existing = await Teacher.findOne({ email });
  if (existing) {
    if (existing.role !== 'admin') throw new Error('ADMIN_EMAIL is already used by a teacher account.');
    // The configured bootstrap admin must be able to reach admin-only routes.
    // This also repairs accounts created before the active status was added.
    if (existing.status !== 'active') {
      existing.status = 'active';
      await existing.save();
      console.log(`Activated admin account: ${email}`);
    }
    return;
  }
  await Teacher.create({
    name: ADMIN_NAME, email, role: 'admin', status: 'active',
    passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10)
  });
  console.log(`Created admin account: ${email}`);
}

async function prepareAttendanceIndexes() {
  await Attendance.updateMany(
    { assignmentId: { $exists: false } },
    { $set: { assignmentId: 'legacy' } }
  );
  const indexes = await Attendance.collection.indexes();
  const oldUniqueIndex = indexes.find(index => index.name === 'course_1_date_1');
  if (oldUniqueIndex) await Attendance.collection.dropIndex(oldUniqueIndex.name);
  await Attendance.collection.createIndex({ course: 1, assignmentId: 1, date: 1 }, { unique: true });
}

const port = process.env.PORT || 5003;
try {
  await connectDB();
  await migrateRosterBatches();
  await prepareAttendanceIndexes();
  await ensureAdminAccount();
  app.listen(port, () => console.log(`API running at http://localhost:${port}`));
} catch (error) {
  console.error('Server startup failed:', error.message);
  process.exit(1);
}
