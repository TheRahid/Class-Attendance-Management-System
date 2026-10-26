import Teacher from "../models/Teacher.js";

export async function listTeachers(_req, res) {
  const teachers = await Teacher.find({ role: "teacher" })
    .select("name email department status createdAt")
    .sort({ createdAt: -1 });

  return res.json({ teachers });
}

export async function updateTeacherStatus(req, res) {
  const { status } = req.body;

  if (!["active", "suspended"].includes(status)) {
    return res.status(400).json({
      message: "Status must be active or suspended.",
    });
  }

  const teacher = await Teacher.findOneAndUpdate(
    { _id: req.params.teacherId, role: "teacher" },
    { status },
    { new: true, runValidators: true }
  ).select("name email department status");

  if (!teacher) {
    return res.status(404).json({ message: "Teacher not found." });
  }

  return res.json({ teacher });
}