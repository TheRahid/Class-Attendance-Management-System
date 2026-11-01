import StudentRoster from '../models/StudentRoster.js';
import Course from '../models/CourseSchema.js';
import Attendance from '../models/AttendanceSchema.js';

const semesterOptions = Array.from({ length: 8 }, (_, index) => `${index + 1}${['st', 'nd', 'rd'][index] || 'th'} semester`);

function migrateSemesterLabel(value) {
    const normalized = String(value || '').trim().toLowerCase();
    const ordinal = normalized.match(/\b([1-8])(st|nd|rd|th)\b/);
    if (ordinal) {
        const number = Number(ordinal[1]);
        return `${number}${['st', 'nd', 'rd'][number - 1] || 'th'} semester`;
    }
    if (normalized.includes('spring')) return '2nd semester';
    return '1st semester';
}

const makeGroupKey = (department, batchNumber, section) =>
    JSON.stringify([department, batchNumber, section].map(value => value.trim().toLocaleLowerCase()));

export async function migrateRosterBatches() {
    const legacyRosters = await StudentRoster.find({
        $or: [{ batchNumber: { $exists: false } }, { batchNumber: '' }]
    });

    for (const roster of legacyRosters) {
        const year = roster.semester?.match(/\b(19|20)\d{2}\b/)?.[0];
        const baseBatch = year || `LEGACY-${String(roster._id).slice(-6)}`;
        let batchNumber = baseBatch;
        let groupKey = makeGroupKey(roster.department, batchNumber, roster.section);
        let suffix = 2;

        while (await StudentRoster.exists({ _id: { $ne: roster._id }, groupKey })) {
            batchNumber = `${baseBatch}-${suffix}`;
            groupKey = makeGroupKey(roster.department, batchNumber, roster.section);
            suffix += 1;
        }

        roster.batchNumber = batchNumber;
        roster.groupKey = groupKey;
        await roster.save();
        console.log(`Migrated student list ${roster._id} to batch ${batchNumber}.`);
    }

    const courses = await Course.find({ 'assignments.0': { $exists: true } });
    for (const course of courses) {
        let changed = false;
        for (const assignment of course.assignments) {
            if (semesterOptions.includes(assignment.semester)) continue;
            const oldSemester = assignment.semester || '';
            await Attendance.updateMany(
                { course: course._id, assignmentId: String(assignment._id) },
                {
                    $set: {
                        roster: assignment.roster || null,
                        semester: oldSemester,
                        section: assignment.section || ''
                    }
                }
            );
            assignment.semester = migrateSemesterLabel(oldSemester);
            changed = true;
        }
        if (changed) await course.save();
    }

    const legacyCourses = await Course.find({ teacher: { $ne: null }, semester: { $nin: semesterOptions } });
    for (const course of legacyCourses) {
        const oldSemester = course.semester || '';
        await Attendance.updateMany(
            { course: course._id, assignmentId: 'legacy' },
            {
                $set: {
                    roster: course.roster || null,
                    semester: oldSemester,
                    section: course.section || ''
                }
            }
        );
        course.semester = migrateSemesterLabel(oldSemester);
        await course.save();
    }
}
