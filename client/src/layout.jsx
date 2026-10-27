import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Overview from './pages/Overview.jsx';
import Teachers from './pages/Teachers.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';
import CourseManagement from './pages/CourseManagement.jsx';
import MyCourses from './pages/MyCourses.jsx';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={<Navigate to="/overview" replace />}
            />
            <Route path="/overview" element={<Overview />} />

            <Route element={<RoleRoute role="admin" />}>
              <Route path="/admin/teachers" element={<Teachers />} />
              <Route
                path="/admin/courses"
                element={<CourseManagement />}
              />
            </Route>

            <Route element={<RoleRoute role="teacher" />}>
              <Route path="/teacher/courses" element={<MyCourses />} />
              <Route
                path="/teacher/attendance"
                element={<PlaceholderPage title="Attendance" />}
              />
              <Route
                path="/teacher/reports"
                element={<PlaceholderPage title="Reports" />}
              />
            </Route>

            <Route
              path="*"
              element={<Navigate to="/overview" replace />}
            />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}