import mongoose from 'mongoose';

const studentRosterSchema = new mongoose.Schema({
    groupKey: { type: String, required: true, unique: true, index: true },
    department: { type: String, required: true, trim: true },
    batchNumber: { type: String, required: true, trim: true },

    // Kept temporarily so existing documents can be migrated without data loss.
    semester: { type: String, default: '', trim: true },

    section: { type: String, required: true, trim: true },
    students: [{
        studentId: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        department: { type: String, default: '', trim: true }
    }]
}, { timestamps: true });

studentRosterSchema.index({ department: 1, batchNumber: 1, section: 1 });

export default mongoose.model('StudentRoster', studentRosterSchema);