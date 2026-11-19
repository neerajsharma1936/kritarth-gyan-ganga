import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Users, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import StudentTable from "../../components/students/StudentTable";
import Modal from "../../components/common/Modal";
import Receipt from "../../components/receipts/Receipt";
import { getPayments, normalizeClassName } from "../../utils/storage";
import { getStudents, archiveStudent } from "../../lib/studentService";

const CLASS_OPTIONS = [
  "All Classes",
  "Nursery",
  "LKG",
  "UKG",
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6",
  "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"
];

export default function Students() {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [showArchived, setShowArchived] = useState(false);
  const [receiptStudent, setReceiptStudent] = useState(null);
  const [deleteStudent, setDeleteStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function refreshStudents() {
    try { setLoadError(""); setStudents(await getStudents({ includeArchived: true })); }
    catch (error) { setLoadError(error.message || "Unable to load students from Supabase."); }
    finally { setLoading(false); }
  }

  useEffect(() => { refreshStudents(); }, []);
  const payments = getPayments();

  const activeStudents = useMemo(() => students.filter(s => showArchived ? s.archived : !s.archived), [students, showArchived]);

  const filtered = useMemo(() => activeStudents.filter((s) => {
    const text = `${s.name} ${s.rollNo} ${s.phone}`.toLowerCase();
    return text.includes(query.trim().toLowerCase()) &&
      (classFilter === "All Classes" || normalizeClassName(s.className) === classFilter);
  }), [activeStudents, query, classFilter]);

  // Total is based on the selected class only, not the search term.
  const totalStudents = useMemo(() => activeStudents.filter((s) =>
    classFilter === "All Classes" || normalizeClassName(s.className) === classFilter
  ).length, [activeStudents, classFilter]);

  const receiptPayment = receiptStudent
    ? payments.filter(p => p.studentId === receiptStudent.id)
        .sort((a,b) => b.date.localeCompare(a.date))[0]
    : null;

  async function confirmDelete() {
    if (!deleteStudent) return;
    try { await archiveStudent(deleteStudent.id); setDeleteStudent(null); await refreshStudents(); }
    catch (error) { setLoadError(error.message || "Unable to archive this student."); }
  }

  return (
    <AppLayout title="Students" subtitle="Manage registered students and fee records">
      <div className="students-modern-page">
        <div className="students-top-row">
          <div className="students-total-card">
            <div className="students-total-icon"><Users size={23} /></div>
            <div><span>Total Students</span><strong>{totalStudents}</strong><small>{classFilter === "All Classes" ? "All registered students" : `${classFilter} students`}</small></div>
          </div>
          <Link className="primary-button students-register-btn" to="/admin/students/new"><Plus size={18} /> Register Student</Link>
        </div>

        <div className="students-filter-bar">
          <div className="students-filter-heading"><div className="students-filter-icon"><Filter size={17} /></div><div><strong>Find Students</strong><span>Search and filter the student list</span></div></div>
          <div className="students-controls">
            <div className="students-search-box"><Search size={18} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, roll no. or phone..." /></div>
            <button type="button" className="secondary-button" onClick={() => setShowArchived(v=>!v)}>{showArchived ? "Show Active" : "Archived Students"}</button><div className="students-class-box"><select aria-label="Filter students by class" value={classFilter} onChange={e => setClassFilter(e.target.value)}>{CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
        </div>

        {loadError && <div className="error-box">{loadError}</div>}
        {loading && <div className="panel">Loading students from Supabase...</div>}
        <div className="panel table-panel students-table-panel">
          <div className="panel-head">
            <div><h2>{classFilter === "All Classes" ? "All Students" : classFilter}</h2><p>{filtered.length} student{filtered.length !== 1 ? "s" : ""} found{query ? ` for “${query}”` : ""}</p></div>
          </div>
          <StudentTable students={filtered} onReceipt={setReceiptStudent} onDelete={setDeleteStudent} />
        </div>
      </div>

      <Modal open={!!receiptStudent} title="Fee Receipt" onClose={() => setReceiptStudent(null)}>
        {receiptStudent && (<><Receipt student={receiptStudent} payment={receiptPayment} /><div className="modal-actions"><button className="primary-button" onClick={() => window.print()}>Print / Save PDF</button></div></>)}
      </Modal>

      <Modal open={!!deleteStudent} title="Archive Student" onClose={() => setDeleteStudent(null)}>
        {deleteStudent && (<div className="delete-confirm"><div className="delete-icon"><Trash2 size={25} /></div><h3>Archive {deleteStudent.name}?</h3><p>The student will be archived and hidden from active lists. Payment history is preserved.</p><div className="modal-actions no-border"><button className="secondary-button" onClick={() => setDeleteStudent(null)}>Cancel</button><button className="danger-button" onClick={confirmDelete}>Archive Student</button></div></div>)}
      </Modal>
    </AppLayout>
  );
}
