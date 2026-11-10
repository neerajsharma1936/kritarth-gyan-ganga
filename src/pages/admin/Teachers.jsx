import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2, IdCard, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import StatCard from "../../components/common/StatCard";
import { getTeachers, saveTeachers, getTeacherSalaryPayments } from "../../utils/storage";
import { currency, dateFormat } from "../../utils/format";

export default function Teachers() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All");
  const [status, setStatus] = useState("All");
  const [sort, setSort] = useState("name");
  const [deleteTeacher, setDeleteTeacher] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const teachers = getTeachers();
  const salaryPayments = getTeacherSalaryPayments();
  const subjects = ["All", ...new Set(teachers.flatMap(t => Array.isArray(t.subjects) ? t.subjects : String(t.subjects || "").split(",").map(s => s.trim()).filter(Boolean)))];
  const filtered = useMemo(() => {
    const rows = teachers.filter(t => {
      const text = `${t.teacherId} ${t.name} ${t.phone} ${t.email} ${(t.subjects || []).join?.(" ") || t.subjects || ""}`.toLowerCase();
      const subjectOk = subject === "All" || (Array.isArray(t.subjects) ? t.subjects.includes(subject) : String(t.subjects || "").includes(subject));
      return text.includes(query.toLowerCase()) && subjectOk && (status === "All" || (t.employmentStatus || "Active") === status);
    });
    return rows.sort((a,b) => sort === "salary" ? Number(b.monthlySalary||0)-Number(a.monthlySalary||0) : String(a.name||"").localeCompare(String(b.name||"")));
  }, [teachers, query, subject, status, sort, refresh]);
  const pendingSalaries = teachers.reduce((sum,t) => {
    const month = new Date().toISOString().slice(0,7);
    const paid = salaryPayments.filter(p => p.teacherId === t.id && p.salaryMonth === month).reduce((s,p)=>s+Number(p.amount||0),0);
    return sum + Math.max(Number(t.monthlySalary||0)-paid,0);
  },0);
  const active = teachers.filter(t => (t.employmentStatus || "Active") === "Active").length;
  function confirmDelete() {
    if (!deleteTeacher) return;
    saveTeachers(teachers.filter(t => t.id !== deleteTeacher.id));
    setDeleteTeacher(null); setRefresh(v=>v+1);
  }
  return <AppLayout title="Teachers" subtitle="Manage teachers, salaries and ID cards">
    <section className="stats-grid">
      <StatCard title="Total Teachers" value={teachers.length} icon={UsersRound} tone="blue" subtitle="Registered teachers" />
      <StatCard title="Active Teachers" value={active} icon={UsersRound} tone="green" subtitle="Currently employed" />
      <StatCard title="Total Monthly Salary" value={currency(teachers.reduce((s,t)=>s+Number(t.monthlySalary||0),0))} icon={IdCard} tone="purple" subtitle="Current payroll" />
      <StatCard title="Pending Salaries" value={currency(pendingSalaries)} icon={IdCard} tone="orange" subtitle="This month" />
    </section>
    <div className="page-actions">
      <div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search teacher, ID, phone..." /></div>
      <div className="action-group teacher-filters">
        <select value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(s=><option key={s}>{s}</option>)}</select>
        <select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Active</option><option>Inactive</option></select>
        <select value={sort} onChange={e=>setSort(e.target.value)}><option value="name">Sort: Name</option><option value="salary">Sort: Salary</option></select>
        <Link to="/admin/teachers/new" className="primary-button"><Plus size={17}/> Add Teacher</Link>
      </div>
    </div>
    <div className="panel"><div className="table-wrap"><table className="teacher-table"><thead><tr><th>Teacher</th><th>ID</th><th>Subjects</th><th>Classes</th><th>Qualification</th><th>Experience</th><th>Contact</th><th>Salary</th><th>Status</th><th>Actions</th></tr></thead><tbody>
      {filtered.length === 0 ? <tr><td colSpan="10" className="empty">No teachers found.</td></tr> : filtered.map(t => <tr key={t.id}>
        <td><Link className="student-cell student-link" to={`/admin/teachers/${t.id}`}><div className="mini-avatar teacher-avatar">{t.photo ? <img src={t.photo} alt=""/> : (t.name||"?").charAt(0)}</div><div><strong>{t.name}</strong><span>{t.gender || ""} · {dateFormat(t.joiningDate)}</span></div></Link></td>
        <td><span className="roll-badge">{t.teacherId}</span></td>
        <td>{(t.subjects || []).join?.(", ") || t.subjects || "-"}</td><td>{(t.classes || []).join?.(", ") || t.classes || "-"}</td>
        <td>{t.qualification || "-"}</td><td>{t.experience ? `${t.experience} yrs` : "-"}</td>
        <td><div>{t.phone || "-"}</div><div className="muted">{t.email || ""}</div></td><td>{currency(t.monthlySalary)}</td>
        <td><span className={`status ${(t.employmentStatus||"Active").toLowerCase() === "active" ? "paid" : "pending"}`}>{t.employmentStatus||"Active"}</span></td>
        <td><div className="actions"><Link className="icon-button" title="View" to={`/admin/teachers/${t.id}`}><Eye size={16}/></Link><Link className="icon-button" title="Edit" to={`/admin/teachers/${t.id}/edit`}><Pencil size={16}/></Link><button className="icon-button danger" title="Delete" onClick={()=>setDeleteTeacher(t)}><Trash2 size={16}/></button></div></td>
      </tr>)}
    </tbody></table></div></div>
    <Modal open={!!deleteTeacher} title="Delete Teacher" onClose={()=>setDeleteTeacher(null)}><div className="delete-confirm"><div className="delete-icon"><Trash2/></div><h3>Delete {deleteTeacher?.name}?</h3><p>This removes the teacher from the active records. Existing salary history is retained.</p><div className="modal-actions"><button className="secondary-button" onClick={()=>setDeleteTeacher(null)}>Cancel</button><button className="danger-button" onClick={confirmDelete}>Delete Teacher</button></div></div></Modal>
  </AppLayout>;
}
