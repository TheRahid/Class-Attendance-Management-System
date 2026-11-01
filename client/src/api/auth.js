import { apiRequest } from "./client.js";

export const registerTeacher = (data) =>
  apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const loginAccount = (data) =>
  apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const fetchTeachers = () => apiRequest("/admin/teachers");

export const setTeacherStatus = (id, status) =>
  apiRequest(`/admin/teachers/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deleteTeacherAccount = (id) =>
  apiRequest(`/admin/teachers/${id}`, {
    method: "DELETE",
  });
