import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  assignmentId: { type: String, required: true, default: 'legacy', index: true },
  roster: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentRoster', default: null, index: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true, index: true },

  // Keep the section details if an admin later changes or removes an assignment.
  semester: { type: String, default: '' },
  section: { type: String, default: '' },

  date: { type: String, required: true },
  entries: [{
    studentId: String,
    name: String,
    status: { type: String, enum: ['present', 'absent'], required: true }
  }]
}, { timestamps: true });

attendanceSchema.index({ course: 1, assignmentId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);