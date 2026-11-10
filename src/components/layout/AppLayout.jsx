import Sidebar from "./Sidebar";
import { getSession } from "../../utils/storage";

export default function AppLayout({ children, role = "admin", title, subtitle, headerActions }) {
  const session = getSession();

  return (
    <div className="app-shell">
      <Sidebar role={role} />
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {headerActions}<div className="profile-chip">
            <div className="avatar">{(session?.name || "A").charAt(0).toUpperCase()}</div>
            <div>
              <strong>{session?.name || "Admin"}</strong>
              <span>{session?.role === "super_admin" ? "Super Admin" : role === "admin" ? "Administrator" : "Student"}</span>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}