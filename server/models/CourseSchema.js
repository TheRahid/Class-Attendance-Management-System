import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  semester: { type: String, default: '', trim: true },
  section: { type: String, default: '', trim: true },
  roster: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentRoster', default: null },
  classTime: { type: String, default: '', trim: true, maxlength: 5 }
});

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true, uppercase: true, unique: true },
  name: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  assignments: { type: [assignmentSchema], default: [] },

  // Legacy fields allow older course records to keep working.
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null, index: true },
  roster: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentRoster', default: null },
  semester: { type: String, default: '', trim: true },
  section: { type: String, default: '', trim: true },
  students: [{ studentId: String, name: String, department: String }]
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);