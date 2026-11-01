import { apiRequest } from "./client.js";

export const fetchAdminCourses = () => apiRequest("/admin/courses");
export const createCourse = (data) =>
  apiRequest("/admin/courses", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateCourse = (id, data) =>
  apiRequest(`/admin/courses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const updateCourseAssignments = (id, assignments) =>
  apiRequest(`/admin/courses/${id}/assignments`, {
    method: "PUT",
    body: JSON.stringify({ assignments }),
  });
export const deleteCourse = (id) =>
  apiRequest(`/admin/courses/${id}`, { method: "DELETE" });
export const fetchMyCourses = () => apiRequest("/teacher/courses");
export const fetchTeacherAttendance = (filters) => {
  const params = new URLSearchParams();
  if (filters.courseId) params.set("courseId", filters.courseId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  return apiRequest(`/teacher/courses/attendance${query ? `?${query}` : ""}`);
};

export const fetchCourseAttendance = (courseId, assignmentId, date) =>
  apiRequest(
    `/teacher/courses/${courseId}/attendance?assignmentId=${encodeURIComponent(assignmentId)}&date=${encodeURIComponent(date)}`,
  );

export const saveCourseAttendance = (courseId, assignmentId, date, entries) =>
  apiRequest(`/teacher/courses/${courseId}/attendance`, {
    method: "PUT",
    body: JSON.stringify({ assignmentId, date, entries }),
  });

export const fetchAdminAttendance = (filters) => {
  const params = new URLSearchParams();
  if (filters.courseId) params.set("courseId", filters.courseId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();
  return apiRequest(`/admin/attendance${query ? `?${query}` : ""}`);
};

export const fetchAdminStudentAttendance = (studentId) => {
  const params = new URLSearchParams({ studentId });
  return apiRequest(`/admin/attendance/student-history?${params.toString()}`);
};

export const fetchTeacherStudentAttendance = (studentId) => {
  const params = new URLSearchParams({ studentId });
  return apiRequest(`/teacher/courses/student-history?${params.toString()}`);
};

export const fetchAdminRosters = () => apiRequest("/admin/rosters");

export const createAdminRoster = (data) =>
  apiRequest("/admin/rosters", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAdminRoster = (id, students) =>
  apiRequest(`/admin/rosters/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ students }),
  });
