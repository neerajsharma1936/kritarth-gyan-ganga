import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getSession } from "../../utils/storage";
import { getCurrentAdminSession } from "../../lib/auth";

export default function ProtectedRoute({ role }) {
  const location = useLocation();
  const [status, setStatus] = useState("checking");
  const [session, setSession] = useState(null);

  useEffect(() => {
    let active = true;
    if (role === "admin") {
      getCurrentAdminSession().then((result) => {
        if (!active) return;
        setSession(result.session);
        setStatus(result.session ? "ready" : "denied");
      }).catch(() => {
        if (active) setStatus("denied");
      });
    } else {
      const localSession = getSession();
      setSession(localSession);
      setStatus("ready");
    }
    return () => { active = false; };
  }, [role]);

  if (status === "checking") {
    return <div className="portal-app" style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Checking secure access…</div>;
  }
  if (status === "denied" || !session) {
    return <Navigate to={role === "student" ? "/student/login" : "/admin/login"} replace state={{ from: location.pathname }} />;
  }
  const roleAllowed = role === "admin"
    ? (session.role === "admin" || session.role === "super_admin")
    : session.role === role;
  if (!roleAllowed) {
    return <Navigate to={(session.role === "admin" || session.role === "super_admin") ? "/admin" : "/student"} replace />;
  }
  return <Outlet />;
}
