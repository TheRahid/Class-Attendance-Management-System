import mongoose from 'mongoose';
import StudentRoster from '../models/StudentRoster.js';

function normalizePart(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function makeGroupKey(department, batchNumber, section) {
    return JSON.stringify(
        [department, batchNumber, section].map(value => value.toLocaleLowerCase())
    );
}

function validateStudents(input) {
    if (!Array.isArray(input) || input.length === 0 || input.length > 500) {
        return { error: 'Add between 1 and 500 students to the roster.' };
    }

    const students = [];
    const ids = new Set();

    for (const item of input) {
        const studentId = normalizePart(item?.studentId);
        const name = normalizePart(item?.name);
        const department = normalizePart(item?.department);
        const normalizedId = studentId.toLowerCase();

        if (!studentId || studentId.length > 30 || !name || name.length > 100 || department.length > 80) {
            return { error: 'Each student needs a valid ID and name.' };
        }
        if (ids.has(normalizedId)) {
            return { error: `Student ID ${studentId} appears more than once.` };
        }

        ids.add(normalizedId);
        students.push({ studentId, name, department });
    }

    return { students };
}

export async function listRosters(_req, res) {
    try {
        const rosters = await StudentRoster.find()
            .sort({ department: 1, batchNumber: 1, section: 1 });
        res.json({ rosters });
    } catch {
        res.status(500).json({ message: 'Could not load student rosters.' });
    }
}

export async function createRoster(req, res) {
    try {
        const department = normalizePart(req.body.department);
        const batchNumber = normalizePart(req.body.batchNumber);
        const section = normalizePart(req.body.section);
        if (!department || !batchNumber || !section) {
            return res.status(400).json({ message: 'Department, batch number, and section are required.' });
        }
        if (batchNumber.length > 30) return res.status(400).json({ message: 'Batch number must be 30 characters or fewer.' });

        const result = validateStudents(req.body.students);
        if (result.error) return res.status(400).json({ message: result.error });

        const roster = await StudentRoster.create({
            groupKey: makeGroupKey(department, batchNumber, section),
            department,
            batchNumber,
            section,
            students: result.students
        });

        res.status(201).json({ roster });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: 'A student list already exists for this department, batch, and section.'
            });
        }
        res.status(500).json({ message: 'Could not create the student roster.' });
    }
}

export async function updateRoster(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.rosterId)) {
            return res.status(400).json({ message: 'Invalid roster ID.' });
        }

        const result = validateStudents(req.body.students);
        if (result.error) return res.status(400).json({ message: result.error });

        const roster = await StudentRoster.findById(req.params.rosterId);
        if (!roster) return res.status(404).json({ message: 'Student roster not found.' });
        roster.students = result.students;
        await roster.save();
        res.json({ roster });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A student list already exists for this department, batch, and section.' });
        }
        res.status(500).json({ message: 'Could not update the student roster.' });
    }
}
