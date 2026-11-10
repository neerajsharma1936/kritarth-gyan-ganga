import { Component } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./LandingPage";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Students from "./pages/admin/Students";
import AddStudent from "./pages/admin/AddStudent";
import StudentDetails from "./pages/admin/StudentDetails";
import StudentDashboard from "./pages/student/StudentDashboard";
import Teachers from "./pages/admin/Teachers";
import TeacherForm from "./pages/admin/TeacherForm";
import TeacherDetails from "./pages/admin/TeacherDetails";
import FeesManagement from "./pages/admin/FeesManagement";
import DemoRequests from "./pages/admin/DemoRequests";
import AdminManagement from "./pages/admin/AdminManagement";
import Offers from "./pages/admin/Offers";
import ClassSchedule from "./pages/admin/ClassSchedule";
import WebsiteContent from "./pages/admin/WebsiteContent";
import StudentAchievements from "./pages/admin/StudentAchievements";
import ProtectedRoute from "./components/common/ProtectedRoute";
import "./portal.css";

function Portal({ children }) {
  return <div className="portal-app">{children}</div>;
}

class AppErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("TuitionPro application error:", error, info); }
  render() {
    if (this.state.error) {
      return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,fontFamily:"Inter,system-ui,sans-serif",background:"#f5f8fc"}}>
        <div style={{maxWidth:620,width:"100%",background:"#fff",borderRadius:16,padding:28,boxShadow:"0 15px 45px rgba(16,43,78,.12)"}}>
          <h2 style={{margin:"0 0 8px",color:"#102b4e"}}>Kritarth Gyan Ganga could not load this page</h2>
          <p style={{margin:"0 0 18px",color:"#62748c"}}>A dashboard component encountered an error. Refresh the page to try again. Your saved records have not been deleted.</p>
          <button onClick={() => window.location.reload()} style={{border:0,borderRadius:9,padding:"11px 16px",background:"#2563eb",color:"#fff",fontWeight:800,cursor:"pointer"}}>Refresh</button>
        </div>
      </div>;
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin/login" element={<Portal><Login initialRole="admin" /></Portal>} />
      <Route path="/student/login" element={<Portal><Login initialRole="student" /></Portal>} />

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<Portal><AdminDashboard /></Portal>} />
        <Route path="/admin/students" element={<Portal><Students /></Portal>} />
        <Route path="/admin/students/new" element={<Portal><AddStudent /></Portal>} />
        <Route path="/admin/students/:id" element={<Portal><StudentDetails /></Portal>} />
        <Route path="/admin/teachers" element={<Portal><Teachers /></Portal>} />
        <Route path="/admin/teachers/new" element={<Portal><TeacherForm /></Portal>} />
        <Route path="/admin/teachers/:id/edit" element={<Portal><TeacherForm /></Portal>} />
        <Route path="/admin/teachers/:id" element={<Portal><TeacherDetails /></Portal>} />
        <Route path="/admin/fees" element={<Portal><FeesManagement /></Portal>} />
        <Route path="/admin/demo-requests" element={<Portal><DemoRequests /></Portal>} />
        <Route path="/admin/admin-management" element={<Portal><AdminManagement /></Portal>} />
        <Route path="/admin/offers" element={<Portal><Offers /></Portal>} />
        <Route path="/admin/website-content" element={<Portal><WebsiteContent /></Portal>} />
        <Route path="/admin/student-achievements" element={<Portal><StudentAchievements /></Portal>} />
        <Route path="/admin/class-schedule" element={<Portal><ClassSchedule /></Portal>} />
      </Route>

      <Route element={<ProtectedRoute role="student" />}>
        <Route path="/student" element={<Portal><StudentDashboard /></Portal>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </AppErrorBoundary>
  );
}
