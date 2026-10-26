import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RoleRoute({ role }) {
  const { account } = useAuth();

  if (!account) {
    return <Navigate to="/login" replace />;
  }

  if (account.role !== role) {
    return <Navigate to="/overview" replace />;
  }

  return <Outlet />;
}