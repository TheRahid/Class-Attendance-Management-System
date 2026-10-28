import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
    index: true
  },
  date: {
    type: String,
    required: true
  },
  entries: [{
    studentId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['present', 'absent'],
      required: true
    }
  }]
}, { timestamps: true });

// One attendance session per course per date.
// Saving again for the same course/date updates that session.
attendanceSchema.index(
  { course: 1, date: 1 },
  { unique: true }
);

export default mongoose.model('Attendance', attendanceSchema);