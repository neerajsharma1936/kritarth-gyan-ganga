import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, UserPlus, LogOut, GraduationCap, UserRound, ReceiptText, ShieldCheck, CalendarDays, Gift, Globe2, Trophy } from "lucide-react";
import { clearSession } from "../../utils/storage";
import { signOutAdmin } from "../../lib/auth";
import logo from "../../assets/kritarth-gyan-ganga-logo.png";

export default function Sidebar({ role, mobileOpen = false, onNavigate }) {
  const navigate = useNavigate();

  async function logout() {
    await signOutAdmin();
    clearSession();
    if (onNavigate) onNavigate();
    navigate("/", { replace: true });
  }

  const adminLinks = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/students", label: "Students", icon: Users },
    { to: "/admin/teachers", label: "Teachers", icon: UserRound },
    { to: "/admin/students/new", label: "Register Student", icon: UserPlus },
    { to: "/admin/fees", label: "Fees Management", icon: ReceiptText },
    { to: "/admin/demo-requests", label: "New Demo Requests", icon: GraduationCap },
    { to: "/admin/admin-management", label: "Admin Management", icon: ShieldCheck },
    { to: "/admin/class-schedule", label: "Classes & Schedule", icon: CalendarDays },
    { to: "/admin/offers", label: "Offers", icon: Gift },
    { to: "/admin/website-content", label: "Website Content", icon: Globe2 },
    { to: "/admin/student-achievements", label: "Student Achievements", icon: Trophy },
  ];

  const studentLinks = [
    { to: "/student", label: "My Dashboard", icon: LayoutDashboard, end: true }
  ];

  const links = (role === "admin" || role === "super_admin") ? adminLinks : studentLinks;

  return (
    <aside className={mobileOpen ? "sidebar mobile-open" : "sidebar"} aria-label="Main navigation">
      <div className="brand">
        <div className="brand-logo"><img src={logo} alt="Kritarth Gyan Ganga logo" /></div>
        <div>
          <strong>Kritarth Gyan Ganga</strong>
        </div>
      </div>

      <nav className="side-nav">
        <p className="nav-label">MENU</p>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <button className="logout-button" onClick={logout}>
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
