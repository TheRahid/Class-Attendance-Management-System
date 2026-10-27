import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null,
    index: true
  },
  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: String,
    required: true,
    trim: true
  },
  classTime: {
    type: String,
    default: ''
  },
  room: {
    type: String,
    default: ''
  },
  students: [{
    studentId: String,
    name: String,
    department: String
  }]
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);