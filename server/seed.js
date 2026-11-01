import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Teacher from './models/TeacherSchema.js';
import Course from './models/CourseSchema.js';
import StudentRoster from './models/StudentRoster.js';
import Attendance from './models/AttendanceSchema.js';
import { migrateRosterBatches } from './config/migrateRosterBatches.js';

const demoPassword = 'RollcallDemo2026!';

const departments = [
    {
        code: 'BBA',
        name: 'Business Administration',
        courses: [
            ['DEMO-BBA101', 'Principles of Management'],
            ['DEMO-BBA102', 'Business Communication']
        ]
    },
    {
        code: 'CSE',
        name: 'Computer Science and Engineering',
        courses: [
            ['DEMO-CSE101', 'Introduction to Programming'],
            ['DEMO-CSE102', 'Data Structures']
        ]
    },
    {
        code: 'THM',
        name: 'Tourism and Hospitality Management',
        courses: [
            ['DEMO-THM101', 'Introduction to Tourism'],
            ['DEMO-THM102', 'Hospitality Operations']
        ]
    }
];

const batches = ['2026', '2027'];
const sections = ['A', 'B'];

const sessionDatesBySemester = {
    '1st semester': ['2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27'],
    '2nd semester': ['2026-03-02', '2026-03-09', '2026-03-16', '2026-03-23'],
    '3rd semester': ['2025-11-03', '2025-11-10', '2025-11-17', '2025-11-24'],
    '4th semester': ['2025-07-07', '2025-07-14', '2025-07-21', '2025-07-28'],
    '5th semester': ['2025-03-03', '2025-03-10', '2025-03-17', '2025-03-24'],
    '6th semester': ['2024-11-04', '2024-11-11', '2024-11-18', '2024-11-25'],
    '7th semester': ['2024-07-01', '2024-07-08', '2024-07-15', '2024-07-22'],
    '8th semester': ['2024-03-04', '2024-03-11', '2024-03-18', '2024-03-25']
};

const firstNames = [
    'Ava', 'Rafi', 'Nila', 'Sami', 'Mina', 'Omar', 'Tara',
    'Ishita', 'Nabil', 'Sadia', 'Arif', 'Maliha', 'Rayan'
];

const lastNames = [
    'Rahman', 'Ahmed', 'Karim', 'Hasan', 'Das', 'Islam',
    'Sultana', 'Chowdhury', 'Hossain', 'Akter', 'Khan', 'Begum', 'Roy'
];

const makeGroupKey = (department, batchNumber, section) =>
    JSON.stringify(
        [department, batchNumber, section].map(value => value.toLocaleLowerCase())
    );

async function seedTeachers() {
    const passwordHash = await bcrypt.hash(demoPassword, 10);
    const teachersByDepartment = new Map();

    for (const department of departments) {
        const departmentTeachers = [];

        for (let number = 1; number <= 5; number += 1) {
            const email = `${department.code.toLowerCase()}.teacher${number}@example.test`;

            const teacher = await Teacher.findOneAndUpdate(
                { email },
                {
                    $set: {
                        name: `${department.code} Teacher ${number}`,
                        email,
                        department: department.name,
                        role: 'teacher',
                        status: 'active',
                        passwordHash
                    }
                },
                {
                    returnDocument: 'after',
                    upsert: true,
                    runValidators: true,
                    setDefaultsOnInsert: true
                }
            );

            departmentTeachers.push(teacher);
        }

        teachersByDepartment.set(department.code, departmentTeachers);
    }

    return teachersByDepartment;
}

async function seedRosters() {
    const rostersByDepartment = new Map();

    for (const department of departments) {
        const departmentRosters = [];

        for (const batchNumber of batches) {
            for (const section of sections) {
                const groupKey = makeGroupKey(department.code, batchNumber, section);
                let roster = await StudentRoster.findOne({ groupKey });

                if (!roster) {
                    roster = new StudentRoster({
                        groupKey,
                        department: department.code,
                        batchNumber,
                        section,
                        students: []
                    });
                }

                const existingIds = new Set(roster.students.map(student => student.studentId));

                for (let index = 0; index < 13; index += 1) {
                    const studentId =
                        `${department.code}-${batchNumber === '2026' ? 'F26' : 'S27'}-${section}-${String(index + 1).padStart(3, '0')}`;

                    if (existingIds.has(studentId)) continue;

                    roster.students.push({
                        studentId,
                        name: `${firstNames[index]} ${lastNames[(index + (section === 'B' ? 3 : 0)) % lastNames.length]}`,
                        department: department.code
                    });
                }

                roster.department = department.code;
                roster.batchNumber = batchNumber;
                roster.groupKey = groupKey;
                roster.section = section;

                await roster.save();
                departmentRosters.push(roster);
            }
        }

        rostersByDepartment.set(department.code, departmentRosters);
    }

    return rostersByDepartment;
}

async function seedCourses(teachersByDepartment, rostersByDepartment) {
    let assignmentCount = 0;

    for (const department of departments) {
        const teachers = teachersByDepartment.get(department.code);
        const rosters = rostersByDepartment.get(department.code);

        for (let courseIndex = 0; courseIndex < department.courses.length; courseIndex += 1) {
            const [code, name] = department.courses[courseIndex];
            let course = await Course.findOne({ code });

            if (!course) course = new Course({ code });

            course.name = name;
            course.department = department.code;

            for (let teacherIndex = 0; teacherIndex < teachers.length; teacherIndex += 1) {
                // Each course has five teachers in both batches.
                // Semester varies across the seeded assignments from 1st through 8th.
                const sectionIndex = courseIndex;

                for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
                    const rosterIndex = batchIndex * sections.length + sectionIndex;
                    const roster = rosters[rosterIndex];
                    const teacher = teachers[teacherIndex];
                    const termNumber =
                        1 + ((teacherIndex + batchIndex * 3 + courseIndex * 2 + departments.indexOf(department) * 4) % 8);
                    const semester = `${termNumber}${['st', 'nd', 'rd'][termNumber - 1] || 'th'} semester`;

                    let assignment = course.assignments.find(item =>
                        String(item.teacher) === String(teacher._id) &&
                        String(item.roster) === String(roster._id)
                    );

                    if (!assignment) {
                        course.assignments.push({
                            teacher: teacher._id,
                            semester,
                            section: roster.section,
                            roster: roster._id
                        });
                        assignmentCount += 1;
                    } else {
                        assignment.semester = semester;
                        assignment.section = roster.section;
                    }
                }
            }

            await course.save();
        }
    }

    return assignmentCount;
}

async function seedAttendance() {
    const demoCourses = await Course.find({ code: /^DEMO-/ });

    const demoTeacherEmails = departments.flatMap(department =>
        Array.from(
            { length: 5 },
            (_, index) => `${department.code.toLowerCase()}.teacher${index + 1}@example.test`
        )
    );

    const demoTeachers = await Teacher.find(
        { email: { $in: demoTeacherEmails } },
        '_id'
    );

    const demoRosterKeys = departments.flatMap(department =>
        batches.flatMap(batchNumber =>
            sections.map(section => makeGroupKey(department.code, batchNumber, section))
        )
    );

    const demoRosters = await StudentRoster.find(
        { groupKey: { $in: demoRosterKeys } },
        '_id'
    );

    const teacherIds = new Set(demoTeachers.map(teacher => String(teacher._id)));
    const rosterIds = new Set(demoRosters.map(roster => String(roster._id)));

    let sessionCount = 0;
    let sequence = 0;

    for (const course of demoCourses) {
        for (const assignment of course.assignments) {
            const dates = sessionDatesBySemester[assignment.semester];

            if (
                !dates ||
                !assignment.roster ||
                !assignment.teacher ||
                !teacherIds.has(String(assignment.teacher)) ||
                !rosterIds.has(String(assignment.roster))
            ) {
                continue;
            }

            const roster = await StudentRoster.findById(assignment.roster);
            if (!roster?.students.length) continue;

            for (let dateIndex = 0; dateIndex < dates.length; dateIndex += 1) {
                const entries = roster.students.map((student, studentIndex) => ({
                    studentId: student.studentId,
                    name: student.name,
                    // Deterministic variation gives reports both present and absent marks.
                    status: (studentIndex + dateIndex + sequence) % 5 === 0 ? 'absent' : 'present'
                }));

                await Attendance.findOneAndUpdate(
                    {
                        course: course._id,
                        assignmentId: String(assignment._id),
                        date: dates[dateIndex]
                    },
                    {
                        $set: {
                            course: course._id,
                            assignmentId: String(assignment._id),
                            roster: roster._id,
                            teacher: assignment.teacher,
                            semester: assignment.semester,
                            section: assignment.section || roster.section,
                            date: dates[dateIndex],
                            entries
                        }
                    },
                    {
                        upsert: true,
                        runValidators: true,
                        setDefaultsOnInsert: true
                    }
                );

                sessionCount += 1;
            }

            sequence += 1;
        }
    }

    return sessionCount;
}

async function seed() {
    if (!process.env.MONGODB_URI) {
        throw new Error('Set MONGODB_URI in server/.env before seeding.');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    await migrateRosterBatches();

    const teachersByDepartment = await seedTeachers();
    const rostersByDepartment = await seedRosters();
    const newAssignments = await seedCourses(teachersByDepartment, rostersByDepartment);
    const attendanceSessions = await seedAttendance();

    console.log(`Seed data is ready in MongoDB database: ${mongoose.connection.name}`);
    console.log('Departments: BBA, CSE, THM');
    console.log('Teachers: 5 per department (15 total), all active.');
    console.log('Student lists: 2 batches × 2 sections per department, 13 seeded students per list (52 per department).');
    console.log('Courses: 2 per department, with seeded assignments across semesters 1–8.');
    console.log(`New course-section assignments added: ${newAssignments}.`);
    console.log(`Demo attendance sessions created or refreshed: ${attendanceSessions} (4 dates per seeded course section).`);
    console.log(`Demo password for all seeded teachers: ${demoPassword}`);
    console.log('Teacher email pattern: bba.teacher1@example.test, cse.teacher1@example.test, thm.teacher1@example.test (numbers 1–5).');
}

seed()
    .catch(error => {
        console.error('Could not seed test data:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });