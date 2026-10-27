import { apiRequest } from './client.js';

export const fetchAdminCourses = () =>
  apiRequest('/admin/courses');

export const createCourse = data =>
  apiRequest('/admin/courses', {
    method: 'POST',
    body: JSON.stringify(data)
  });

export const updateCourse = (id, data) =>
  apiRequest(`/admin/courses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });

export const deleteCourse = id =>
  apiRequest(`/admin/courses/${id}`, {
    method: 'DELETE'
  });

export const fetchMyCourses = () =>
  apiRequest('/teacher/courses');