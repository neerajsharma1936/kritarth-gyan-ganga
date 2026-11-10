import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, ShieldCheck, UserRound } from "lucide-react";
import { getStudents, setSession, authenticateAdmin, getSession } from "../utils/storage";
import logo from "../assets/kritarth-gyan-ganga-logo.png";

export default function Login({ initialRole = "admin" }) {
  const navigate = useNavigate();
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Never leave an already-authenticated user on the login portal.
    // A logged-out user has no session and remains here normally.
    const session = getSession();
    if (session) navigate(session.role === "student" ? "/student" : "/admin", { replace: true });
  }, [navigate]);

  function login(e) {
    e.preventDefault();
    setError("");

    if (role === "admin") {
      const admin = authenticateAdmin(email, password);
      if (admin) {
        setSession({ role: admin.role === "super_admin" ? "super_admin" : "admin", isSuperAdmin: admin.role === "super_admin" || admin.isSuperAdmin === true, userId: admin.id || admin.email, name: admin.name, email: admin.email });
        navigate("/admin");
      } else {
        setError("Invalid admin email or password. Use the Super Admin credentials or an administrator account created by the Super Admin.");
      }
      return;
    }

    const student = getStudents().find((s) => s.email.toLowerCase() === email.toLowerCase());
    if (student && password === "student123") {
      setSession({ role: "student", name: student.name, studentId: student.id });
      navigate("/student");
    } else {
      setError("Invalid student email or password. Please check your credentials.");
    }
  }

  return (
    <div className="login-page">
      <div className="login-decoration">
        <div className="login-brand"><img src={logo} alt="Kritarth Gyan Ganga logo" /> <span>Kritarth Gyan Ganga</span></div>
        <h1>Manage your tuition center with ease.</h1>
        <p>Students, fees, receipts and records — all in one simple dashboard.</p>
        <div className="feature-list">
          <span><ShieldCheck size={18} /> Secure role-based access</span>
          <span><ShieldCheck size={18} /> Fee tracking & receipts</span>
          <span><ShieldCheck size={18} /> Student management</span>
        </div>
      </div>

      <div className="login-card-wrap">
        <form className="login-card" onSubmit={login}>
          <div className="mobile-logo"><img src={logo} alt="Kritarth Gyan Ganga logo" /></div>
          <h2>Welcome back</h2>
          <p>Sign in to continue to Kritarth Gyan Ganga</p>

          <div className="role-switch">
            <button type="button" className={role === "admin" ? "selected" : ""} onClick={() => setRole("admin")}><ShieldCheck size={17} /> Admin</button>
            <button type="button" className={role === "student" ? "selected" : ""} onClick={() => setRole("student")}><UserRound size={17} /> Student</button>
          </div>

          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={role === "admin" ? "admin@tuitionpro.com" : "rahul@example.com"} required />
          </label>

          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>

          {error && <div className="error-box">{error}</div>}
          <button className="primary-button full" type="submit">Sign In</button>

        </form>
      </div>
    </div>
  );
}