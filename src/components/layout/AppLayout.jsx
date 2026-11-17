import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { getSession } from "../../utils/storage";

export default function AppLayout({ children, role = "admin", title, subtitle, headerActions }) {
  const session = getSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar
        role={role}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />
      {mobileNavOpen && (
        <button
          type="button"
          className="mobile-sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <main className="main-content">
        <header className="topbar">
          <div className="topbar-title-group">
            <button
              type="button"
              className="mobile-nav-toggle"
              aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              {mobileNavOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
            <div>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
          {headerActions}
          <div className="profile-chip">
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
