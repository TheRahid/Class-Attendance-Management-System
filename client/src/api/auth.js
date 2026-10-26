import { apiRequest } from "./client.js";

export function registerTeacher(data) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function loginAccount(data) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchTeachers() {
  return apiRequest("/admin/teachers");
}

export function updateTeacherStatus(id, status) {
  return apiRequest(`/admin/teachers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}