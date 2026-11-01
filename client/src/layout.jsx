import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import RoleRoute from './components/RoleRoute.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Overview from './pages/Overview.jsx';
import Teachers from './pages/Teachers.jsx';
import CourseManagement from './pages/CourseManagement.jsx';
import MyCourses from './pages/MyCourses.jsx';
import Attendance from './pages/Attendance.jsx';
import Reports from './pages/Reports.jsx';
import StudentRosters from './pages/StudentRosters.jsx';
import CourseAssignments from './pages/CourseAssignments.jsx';

export default function AppRoutes() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<Login/>}/>
    <Route path="/register" element={<Register/>}/>
    <Route element={<ProtectedRoute/>}>
      <Route element={<AppLayout/>}>
        <Route path="/" element={<Navigate to="/overview" replace/>}/>
        <Route path="/overview" element={<Overview/>}/>
        <Route element={<RoleRoute role="admin"/>}>
          <Route path="/admin/teachers" element={<Teachers/>}/>
          <Route path="/admin/courses" element={<CourseManagement/>}/>
          <Route path="/admin/assignments" element={<CourseAssignments/>}/>
          <Route path="/admin/rosters" element={<StudentRosters/>}/>
          <Route path="/admin/reports" element={<Reports/>}/>
        </Route>
        <Route element={<RoleRoute role="teacher"/>}>
          <Route path="/teacher/courses" element={<MyCourses/>}/>
          <Route path="/teacher/attendance" element={<Attendance/>}/>
          <Route path="/teacher/reports" element={<Reports/>}/>
        </Route>
        <Route path="*" element={<Navigate to="/overview" replace/>}/>
      </Route>
    </Route>
  </Routes></BrowserRouter>;
}
