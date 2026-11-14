import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, UserRound } from "lucide-react";
import { getStudents, setSession, getSession } from "../utils/storage";
import { getCurrentAdminSession, signInAdmin } from "../lib/auth";
import { isSupabaseConfigured } from "../lib/supabase";
import logo from "../assets/kritarth-gyan-ganga-logo.png";

export default function Login({ initialRole = "admin" }) {
  const navigate = useNavigate();
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkExistingSession() {
      if (initialRole === "admin") {
        const result = await getCurrentAdminSession();
        if (active && result.session) navigate("/admin", { replace: true });
      } else {
        const session = getSession();
        if (active && session?.role === "student") navigate("/student", { replace: true });
      }
    }
    checkExistingSession();
    return () => { active = false; };
  }, [initialRole, navigate]);

  async function login(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (role === "admin") {
        const result = await signInAdmin(email, password);
        if (result.error) {
          setError(result.error.message || "Unable to sign in. Check your credentials and administrator access.");
          return;
        }
        navigate("/admin");
        return;
      }
      // Student accounts remain on the existing local data flow until student
      // accounts and student records are migrated together in a separate phase.
      const student = getStudents().find((s) => String(s.email || "").toLowerCase() === email.toLowerCase());
      if (student && password === "student123") {
        setSession({ role: "student", name: student.name, studentId: student.id });
        navigate("/student");
      } else {
        setError("Invalid student email or password. Please check your credentials.");
      }
    } catch (err) {
      setError(err?.message || "An unexpected sign-in error occurred.");
    } finally {
      setLoading(false);
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
            <button type="button" className={role === "admin" ? "selected" : ""} onClick={() => { setRole("admin"); setError(""); }}><ShieldCheck size={17} /> Admin</button>
            <button type="button" className={role === "student" ? "selected" : ""} onClick={() => { setRole("student"); setError(""); }}><UserRound size={17} /> Student</button>
          </div>
          <label>Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={role === "admin" ? "admin@example.com" : "student@example.com"} required />
          </label>
          <label>Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </label>
          {role === "admin" && !isSupabaseConfigured && <div className="error-box">Supabase connection settings are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your hosting environment.</div>}
          {error && <div className="error-box">{error}</div>}
          <button className="primary-button full" type="submit" disabled={loading || (role === "admin" && !isSupabaseConfigured)}>{loading ? "Signing in…" : "Sign In"}</button>
        </form>
      </div>
    </div>
  );
}
