import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getSession } from "../../utils/storage";

export default function ProtectedRoute({ role }) {
  const session = getSession();
  const location = useLocation();

  if (!session) return <Navigate to={role === "student" ? "/student/login" : "/admin/login"} replace state={{ from: location.pathname }} />;
  const roleAllowed = role === "admin" ? (session.role === "admin" || session.role === "super_admin") : session.role === role;
  if (!roleAllowed) {
    return <Navigate to={(session.role === "admin" || session.role === "super_admin") ? "/admin" : "/student"} replace />;
  }

  return <Outlet />;
}
