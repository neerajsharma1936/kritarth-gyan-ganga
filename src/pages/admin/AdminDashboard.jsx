import { useMemo, useState } from "react";
import { Users, UserRound, School, GraduationCap, UserPlus, CreditCard, Gift, ShieldPlus, Search, ArrowRight, CalendarDays, MapPin, Megaphone, Globe2 } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { getStudents, getTeachers, getDemoRequests, getOffer, getClassSchedule } from "../../utils/storage";

const classes = [
  { time: "04:00 PM", name: "Class 8 Mathematics", teacher: "Rahul Sir", room: "Room 2", status: "Live Soon", tone: "blue" },
  { time: "05:00 PM", name: "Class 10 Science", teacher: "Priya Ma'am", room: "Room 1", status: "Upcoming", tone: "purple" },
  { time: "06:30 PM", name: "Class 12 Physics", teacher: "Amit Sir", room: "Online", status: "Upcoming", tone: "orange" }
];

const quickActions = [
  { label: "Add Student", description: "Register a new student", icon: UserPlus, tone: "blue", to: "/admin/students/new" },
  { label: "Add Teacher", description: "Add or manage teachers", icon: UserRound, tone: "purple", to: "/admin/teachers/new" },
  { label: "Add Payment", description: "Collect student fees", icon: CreditCard, tone: "green", to: "/admin/fees" },
  { label: "New Demo Request", description: "View and manage demo requests", icon: GraduationCap, tone: "pink", to: "/admin/demo-requests" },
  { label: "Create Offer", description: "Create and manage offers", icon: Gift, tone: "orange", to: "/admin/offers" },
  { label: "Add Admin", description: "Create new admin account", icon: ShieldPlus, tone: "teal", to: "/admin/admin-management" },
  { label: "Website Content", description: "Manage hero, stories and contact details", icon: Globe2, tone: "blue", to: "/admin/website-content" }
];

export default function AdminDashboard() {
  const students = getStudents().filter(s => !s.archived);
  const teachers = getTeachers();
  const demos = getDemoRequests();
  const offer = getOffer();
  const schedule = getClassSchedule();
  const [query, setQuery] = useState("");

  const filteredDemos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return demos.slice(0, 5);
    return demos.filter(r => [r.name,r.parent,r.className,r.subject,r.phone,r.status].some(v => String(v||"").toLowerCase().includes(q))).slice(0,5);
  }, [demos, query]);

  const session = (() => {
    try { return JSON.parse(localStorage.getItem("tms_session") || "null"); } catch { return null; }
  })();

  const displayOffer = offer || { discount:"20% OFF", title:"New Admission Offer", description:"Get 20% OFF on your first month's tuition fee.", expiry:"Ends in 5 Days", live:true };

  return (
    <AppLayout
      title={`Good Morning, ${session?.name || "Admin"} 👋`}
      subtitle="Here's what's happening with your tuition institute today."
      headerActions={<div className="dashboard-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search anything..." /></div>}
    >
      <div className="dashboard-reference dashboard-modern">
        <section className="dashboard-stat-grid">
          <Stat title="Total Students" value={students.length} subtitle="Registered students" icon={Users} tone="blue"/>
          <Stat title="Total Teachers" value={teachers.length} subtitle="Active teaching staff" icon={UserRound} tone="purple"/>
          <Stat title="Total Classes" value={12} subtitle="All classes active" icon={School} tone="orange"/>
          <Stat title="Free Demo Requests" value={demos.length} subtitle={`${demos.filter(d=>d.status==="New").length} new today`} icon={GraduationCap} tone="pink"/>
        </section>

        <section className="dashboard-reference-quick">
          <div className="dashboard-reference-heading">
            <div><h2>Quick Access</h2><p>Manage your institute with quick actions</p></div>
            <Link to="/admin/students" className="dashboard-view-link">View All Actions <ArrowRight size={14}/></Link>
          </div>
          <div className="dashboard-reference-action-grid">
            {quickActions.map(({label,description,icon:Icon,tone,to})=>(
              <Link to={to} className={`dashboard-reference-action ${tone}`} key={label}>
                <span className="reference-action-icon"><Icon size={27}/></span>
                <span className="reference-action-copy"><strong>{label}</strong><small>{description}</small></span>
                <span className="reference-action-arrow"><ArrowRight size={19}/></span>
              </Link>
            ))}
          </div>
        </section>

        <section className="dashboard-content-grid lower-grid">
          <div className="dashboard-panel">
            <div className="dashboard-panel-head">
              <h2><CalendarDays size={19}/> Today's Classes</h2>
              <Link to="/admin/class-schedule" className="dashboard-view-link">View Full Schedule <ArrowRight size={14}/></Link>
            </div>
            <div className="class-list">
              {schedule.slice(0,3).map(c=><div className="class-row" key={c.name}>
                <span className={`class-time ${c.tone}`}>{c.time}</span>
                <div className="class-main"><strong>{c.name}</strong><span>{c.teacher}</span></div>
                <span className="class-room"><MapPin size={12}/> {c.room}</span>
                <span className={`class-status ${c.status==="Live Soon"?"live":"upcoming"}`}>{c.status}</span>
              </div>)}
            </div>
          </div>

          <div className="dashboard-panel offer-panel">
            <div className="dashboard-panel-head">
              <h2><Megaphone size={19}/> Active Landing Page Offer</h2>
              <Link to="/admin/offers" className="dashboard-view-link">Edit</Link>
            </div>
            <div className="offer-card">
              <div>
                <span className="offer-fire">🔥 {displayOffer.discount}</span>
                <h3>{displayOffer.title}</h3>
                <p>{displayOffer.description}</p>
                <span className="offer-expiry">{displayOffer.expiry}</span>
                <div className="offer-actions">
                  <Link to="/" className="offer-preview">Preview Website</Link>
                  <Link to="/admin/offers" className="offer-unpublish">{displayOffer.live ? "Manage Offer" : "Publish Offer"}</Link>
                </div>
              </div>
              <div className="offer-gift">🎁</div>
              {displayOffer.live && <span className="offer-live">LIVE</span>}
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

function Stat({title,value,subtitle,icon:Icon,tone}){
  return <div className={`dashboard-stat-card ${tone}`}>
    <div className="dashboard-stat-icon"><Icon size={23}/></div>
    <div className="dashboard-stat-copy"><p>{title}</p><strong>{value}</strong><span>{subtitle}</span></div>
    <div className="dashboard-stat-decoration" />
  </div>;
}
