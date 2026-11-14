import { useMemo, useRef, useState } from "react";
import {
  AlertCircle, ArrowDownToLine, CalendarDays, CheckCircle2, ChevronDown,
  CircleDollarSign, Download, Eye, IndianRupee, MoreHorizontal, Plus, Printer,
  Search, TrendingUp, Users, XCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import Receipt from "../../components/receipts/Receipt";
import { getStudents, getPayments, addPayment, getSession } from "../../utils/storage";
import { currency, dateFormat } from "../../utils/format";
import { feePlanForMonth, getMonthStatus, monthlyFeeAmount } from "../../utils/monthlyFees";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const money = (n) => currency(Math.max(0, Number(n || 0)));
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonthNumber = String(currentDate.getMonth() + 1).padStart(2, "0");
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const monthName = (value) => value
  ? new Date(`${value}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
  : "All months";

export default function FeesManagement() {
  const students = getStudents().filter(s => !s.archived);
  const payments = getPayments();
  const receiptRef = useRef(null);
  const [query, setQuery] = useState("");
  // Draft filter values are edited in the controls. They are applied only after Apply Filter.
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedQuery, setSelectedQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [paymentStudent, setPaymentStudent] = useState(null);
  const [receiptPayment, setReceiptPayment] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [isCleared, setIsCleared] = useState(true);

  const classOptions = [
    "Nursery", "LKG", "UKG",
    ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`)
  ];
  const normalizeClass = (value = "") => {
    const v = String(value).trim().toLowerCase();
    if (v === "nursery" || v === "nursary") return "Nursery";
    if (v === "lkg") return "LKG";
    if (v === "ukg") return "UKG";
    const match = v.match(/(?:class\s*)?(\d+)(?:th|st|nd|rd)?/);
    return match ? `Class ${Number(match[1])}` : String(value).trim();
  };
  const studentMatchesClass = (student, selected) => {
    if (!selected) return true;
    if (appliedMonth) return normalizeClass(feePlanForMonth(student, `${appliedYear || currentYear}-${appliedMonth}`).className) === selected;
    if (appliedYear) return Array.from({length:12}, (_,i) => `${appliedYear}-${String(i+1).padStart(2,"0")}`).some(key => normalizeClass(feePlanForMonth(student, key).className) === selected);
    return normalizeClass(student.className) === selected;
  };
  // Keep the selector independent from stored payments so every calendar month is always available.
  // The range is intentionally wider than the requested minimum and requires no code changes each year.
  const availableYears = Array.from(
    { length: 16 },
    (_, index) => String(currentYear - 5 + index)
  );
  const appliedYear = year || null;
  const appliedMonth = month || null;
  const appliedClass = classFilter || null;
  const selectedMonthKey = appliedMonth && appliedYear ? `${appliedYear}-${appliedMonth}` : null;

  const getRow = (student) => {
    const yearMonths = Array.from({ length: 12 }, (_, index) => `${appliedYear || currentYear}-${String(index + 1).padStart(2, "0")}`);
    const monthPayments = payments.filter(p => {
      const fm = p.feeMonth || String(p.date || "").slice(0, 7);
      const monthMatch = !appliedMonth || fm.endsWith(`-${appliedMonth}`);
      return p.status !== "reversed" && p.studentId === student.id && fm.startsWith(String(appliedYear || currentYear)) && monthMatch;
    });
    const yearPayments = payments.filter(p => {
      const fm = p.feeMonth || String(p.date || "").slice(0, 7);
      return p.status !== "reversed" && p.studentId === student.id && fm.startsWith(String(appliedYear || currentYear));
    });
    const paid = monthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    // Fee amount is resolved for each fee month, so a promotion/new fee next year
    // never changes the historical amount owed for previous months.
    const expected = selectedMonthKey
      ? getMonthStatus(student, selectedMonthKey, payments).amount
      : appliedMonth
        ? getMonthStatus(student, `${appliedYear || currentYear}-${appliedMonth}`, payments).amount
        : yearMonths.reduce((sum, key) => sum + getMonthStatus(student, key, payments).amount, 0);
    const remaining = Math.max(expected - paid, 0);
    const status = paid >= expected && expected > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";
    const currentYm = `${currentYear}-${currentMonthNumber}`;
    const overdue = selectedMonthKey ? (selectedMonthKey >= currentYm ? 0 : remaining) : 0;
    const last = yearPayments.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
    return { fee: selectedMonthKey || appliedMonth ? expected : monthlyFeeAmount(student), expected, paid, remaining, status, overdue, last, monthPayments };
  };

  const stats = useMemo(() => {
    if (isCleared) return { expected: 0, collected: 0, pending: 0, pendingStudents: 0, overdue: 0, overdueStudents: 0, students: 0, rate: 0 };
    const scopedStudents = students.filter(s => studentMatchesClass(s, appliedClass));
    // Use historical fee plans for each month instead of multiplying the current fee.
    // Without a selected year, the dashboard consistently defaults to the current year.
    const targetYear = String(appliedYear || currentYear);
    const expectedMonths = appliedMonth
      ? [`${targetYear}-${appliedMonth}`]
      : Array.from({ length: 12 }, (_, index) => `${targetYear}-${String(index + 1).padStart(2, "0")}`);
    const expected = scopedStudents.reduce((sum, student) =>
      sum + expectedMonths.reduce((monthTotal, monthKey) =>
        monthTotal + getMonthStatus(student, monthKey, payments).amount, 0
      ), 0
    );
    const selectedPayments = payments.filter(p => {
      const fm = p.feeMonth || String(p.date || "").slice(0, 7);
      const monthMatch = !appliedMonth || fm === `${targetYear}-${appliedMonth}`;
      return p.status !== "reversed" && monthMatch && fm.startsWith(targetYear) && (!appliedClass || studentMatchesClass(students.find(s => s.id === p.studentId) || {}, appliedClass));
    });
    const collected = selectedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const pending = appliedMonth
      ? scopedStudents.reduce((sum, s) => sum + getRow(s).remaining, 0)
      : Math.max(expected - collected, 0);
    const pendingStudents = scopedStudents.filter(s => getRow(s).remaining > 0).length;
    const overdue = scopedStudents.reduce((sum, s) => sum + getRow(s).overdue, 0);
    const overdueStudents = scopedStudents.filter(s => getRow(s).overdue > 0).length;
    const rate = expected ? Math.round((collected / expected) * 100) : 0;
    return { expected, collected, pending, pendingStudents, overdue, overdueStudents, students: scopedStudents.length, rate };
  }, [students, payments, selectedMonthKey, appliedMonth, appliedYear, appliedClass, refresh, isCleared]);

  const filtered = isCleared ? [] : students.filter(s => {
    const row = getRow(s);
    const haystack = `${s.name} ${s.rollNo} ${s.phone} ${s.className}`.toLowerCase();
    const periodMatch = !appliedMonth
      ? true
      : row.monthPayments.length > 0 || row.status === "Pending";
    const yearMatch = !appliedYear
      ? true
      : payments.some(p => p.studentId === s.id && String(p.feeMonth || p.date || "").startsWith(appliedYear)) || row.status === "Pending";
    return haystack.includes(query.toLowerCase()) &&
      studentMatchesClass(s, appliedClass) &&
      (!statusFilter || statusFilter === row.status) &&
      periodMatch && yearMatch;
  });

  const collectionByMonth = useMemo(() => {
    if (isCleared) return MONTHS.map((label, index) => ({ key:`${currentYear}-${String(index + 1).padStart(2, "0")}`, label:label.slice(0,3), amount:0 }));
    const baseYear = Number(appliedYear || currentYear);
    return MONTHS.map((label, index) => {
      const key = `${baseYear}-${String(index + 1).padStart(2, "0")}`;
      const amount = payments
        .filter(p => p.status !== "reversed" && (p.feeMonth || String(p.date || "").slice(0, 7)) === key && (!appliedClass || studentMatchesClass(students.find(s => s.id === p.studentId) || {}, appliedClass)))
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);
      return { key, label: label.slice(0, 3), amount };
    });
  }, [payments, students, appliedYear, appliedClass, refresh, isCleared]);

  const [form, setForm] = useState({ feeMonth: selectedMonthKey || `${currentYear}-${currentMonthNumber}`, amount: "", date: new Date().toISOString().slice(0, 10), mode: "UPI", reference: "", note: "" });
  const openPayment = (student) => {
    setPaymentStudent(student);
    setForm({ feeMonth: selectedMonthKey || `${currentYear}-${currentMonthNumber}`, amount: "", date: new Date().toISOString().slice(0, 10), mode: "UPI", reference: "", note: "" });
  };
  const monthSummary = paymentStudent ? getMonthStatus(paymentStudent, form.feeMonth, payments) : { amount: 0, paid: 0, remaining: 0 };

  function save(e) {
    e.preventDefault();
    const amount = Number(form.amount || 0);
    if (!paymentStudent || amount <= 0) return alert("Payment amount must be greater than ₹0.");
    if (amount > monthSummary.remaining) return alert(`Amount cannot exceed the remaining ${money(monthSummary.remaining)} for this month.`);
    addPayment({ studentId: paymentStudent.id, amount, date: form.date, mode: form.mode, reference: form.reference.trim(), note: form.note.trim() || "Tuition fee", feeMonth: form.feeMonth });
    setPaymentStudent(null);
    setRefresh(v => v + 1);
  }

  async function downloadReceipt() {
    if (!receiptRef.current || !receiptPayment) return;
    const exportNode = receiptRef.current.cloneNode(true);
    exportNode.classList.add("receipt-export");
    exportNode.removeAttribute("id");
    const exportHost = receiptRef.current.closest(".portal-app") || document.body;
    exportHost.appendChild(exportNode);
    try {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const canvas = await html2canvas(exportNode, {
        width: 1024,
        height: 1536,
        windowWidth: 1024,
        windowHeight: 1536,
        scale: 2,
        useCORS: true,
        backgroundColor: "#fff",
        logging: false
      });
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [1024, 1536],
        compress: true
      });
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.98), "JPEG", 0, 0, 1024, 1536, undefined, "FAST");
      pdf.save(`Kritarth-Gyan-Ganga-Fee-Receipt-${receiptPayment.id || "RECEIPT"}.pdf`);
    } finally {
      exportNode.remove();
    }
  }

  function exportFees() {
    const rows = filtered.map(s => {
      const r = getRow(s);
      return [s.rollNo, s.name, s.className, r.expected, r.paid, r.remaining, r.status, r.last?.date || "", r.last?.collectedByName || ""].join(",");
    });
    const csv = ["Roll No,Student,Class,Expected,Paid,Pending,Status,Last Payment,Collected By", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `tuitionpro-fees-${month || "all"}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }

  const maxChart = Math.max(...collectionByMonth.map(x => x.amount), 1);

  return <AppLayout title="Fees Management" subtitle="Track and manage all student fees collections and dues easily." headerActions={
    <div className="fees-top-actions"><div className="header-search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search students..."/></div></div>
  }>
    <div className="fees-page">
      <div className="fees-intro-row">
        <div><span className="eyebrow">COLLECTION OVERVIEW</span><h2>Fees Overview</h2><p>Monitor collections, pending balances and overdue tuition at a glance.</p></div>
        <div className="fees-period"><CalendarDays size={16}/><span>{selectedMonthKey ? monthName(selectedMonthKey) : appliedYear ? `All months • ${appliedYear}` : "All months"}</span><ChevronDown size={15}/></div>
      </div>

      <section className="fees-stat-grid">
        <div className="fees-stat-card green"><div className="fees-stat-icon"><CircleDollarSign size={22}/></div><div><span>Total Collection</span><strong>{money(stats.collected)}</strong><small>{selectedMonthKey ? monthName(selectedMonthKey) : appliedMonth ? `${MONTHS[Number(appliedMonth) - 1]}${appliedYear ? ` • ${appliedYear}` : ""}` : "Selected period"}</small></div><TrendingUp className="stat-corner" size={19}/></div>
        <div className="fees-stat-card orange"><div className="fees-stat-icon"><AlertCircle size={22}/></div><div><span>Pending Fees</span><strong>{money(stats.pending)}</strong><small>{stats.pendingStudents} students pending / partial</small></div></div>
        <div className="fees-stat-card red"><div className="fees-stat-icon"><XCircle size={22}/></div><div><span>Overdue Fees</span><strong>{money(stats.overdue)}</strong><small>{stats.overdueStudents} overdue students</small></div></div>
        <div className="fees-stat-card purple"><div className="fees-stat-icon"><Users size={22}/></div><div><span>Total Students</span><strong>{stats.students}</strong><small>Active students</small></div></div>
        <div className="fees-stat-card blue rate-card"><div className="rate-ring" style={{"--rate": `${stats.rate * 3.6}deg`}}><div>{stats.rate}%</div></div><div><span>Collection Rate</span><strong>{stats.rate}%</strong><small>{money(stats.collected)} collected of {money(stats.expected)}</small></div></div>
      </section>

      <section className="fees-filter-panel">
        <div className="filter-title"><div><h3>Advanced Filters</h3><p>Refine the fee records by period, class and payment status.</p></div><button className="clear-filter" onClick={() => {
          setSelectedQuery(""); setSelectedMonth(""); setSelectedYear(""); setSelectedClass(""); setSelectedStatus("");
          setQuery(""); setMonth(""); setYear(""); setClassFilter(""); setStatusFilter("");
          setIsCleared(true);
        }}>Clear filters</button></div>
        <div className="filter-grid">
          <label><span>Search</span><div className="filter-search"><Search size={16}/><input value={selectedQuery} onChange={e=>setSelectedQuery(e.target.value)} placeholder="Student name, roll no..."/></div></label>
          <label><span>Month</span><select value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}><option value="">Select Month</option>{MONTHS.map((name, index) => { const value = String(index + 1).padStart(2, "0"); return <option key={value} value={value}>{name}</option>; })}</select></label>
          <label><span>Year</span><select value={selectedYear} onChange={e=>setSelectedYear(e.target.value)}><option value="">Select Year</option>{availableYears.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
          <label><span>Class</span><select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}><option value="">Select Class</option>{classOptions.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
          <label><span>Status</span><select value={selectedStatus} onChange={e=>setSelectedStatus(e.target.value)}><option value="">Select Status</option><option>Paid</option><option>Partial</option><option>Pending</option></select></label>
          <div className="filter-actions"><button className="primary-button" onClick={() => { setQuery(selectedQuery); setMonth(selectedMonth); setYear(selectedYear); setClassFilter(selectedClass); setStatusFilter(selectedStatus); setIsCleared(false); }}>Apply Filter</button><button className="export-button" onClick={exportFees}><ArrowDownToLine size={16}/> Export CSV</button></div>
        </div>
      </section>

      <section className="fees-content-grid">
        <div className="panel fees-table-panel">
          <div className="panel-head fees-panel-head"><div><h2>Student Fee Records</h2><p>{filtered.length} of {students.length} students shown</p></div><button className="primary-button" onClick={() => filtered[0] && openPayment(filtered[0])}><Plus size={16}/> Record Payment</button></div>
          <div className="table-wrap"><table className="fees-table"><thead><tr><th>Student</th><th>Class</th><th>Monthly Fee</th><th>Paid</th><th>Pending</th><th>Status</th><th>Last Payment</th><th>Collected By</th><th>Actions</th></tr></thead><tbody>
            {filtered.length ? filtered.map(s => { const r=getRow(s); return <tr key={s.id}><td><Link className="fees-student" to={`/admin/students/${s.id}`}><div className="mini-avatar">{s.name.charAt(0)}</div><div><strong>{s.name}</strong><span>{s.rollNo}</span></div></Link></td><td><span className="class-pill">{s.className}</span></td><td><strong>{money(r.fee)}</strong></td><td className="paid">{money(r.paid)}</td><td className="pending-amount">{money(r.remaining)}</td><td><span className={`status ${r.status.toLowerCase()}`}>{r.status.toUpperCase()}</span></td><td>{dateFormat(r.last?.date)}</td><td><span className="collector-cell">{r.last?.collectedByName || "—"}{r.last?.collectedByRole ? <small>{r.last.collectedByRole}</small> : null}</span></td><td><div className="actions"><Link className="table-action" to={`/admin/students/${s.id}`} title="View details"><Eye size={15}/></Link><button className="table-action" onClick={()=>openPayment(s)} disabled={r.remaining<=0} title="Record payment"><Plus size={15}/></button><button className="table-action" onClick={()=>setReceiptPayment(r.last||null)} disabled={!r.last} title="Receipt"><Printer size={15}/></button><button className="table-action" title="More"><MoreHorizontal size={15}/></button></div></td></tr>}) : <tr><td colSpan="9" className="empty">No students match your filters.</td></tr>}
          </tbody></table></div>
        </div>
        <div className="panel collection-panel"><div className="panel-head"><div><h2>Collection Trend</h2><p>Recent payment collections</p></div><TrendingUp size={18} className="trend-icon"/></div><div className="chart"><div className="chart-grid-lines"><span></span><span></span><span></span><span></span></div>{collectionByMonth.map(x=><div className="chart-bar-wrap" key={x.key}><div className="chart-value">{x.amount ? money(x.amount).replace("₹", "₹") : "—"}</div><div className="chart-bar" style={{height:`${Math.max(8,(x.amount/maxChart)*150)}px`}}></div><span>{x.label}</span></div>)}</div><div className="chart-footer"><div><span>Total collected</span><strong>{money(stats.collected)}</strong></div><div><span>Rate</span><strong className="text-green">{stats.rate}%</strong></div></div></div>
      </section>

      <Modal open={!!receiptPayment} title="Fee Receipt" onClose={()=>setReceiptPayment(null)}><div ref={receiptRef}><Receipt student={students.find(s=>s.id===receiptPayment?.studentId)||{}} payment={receiptPayment} payments={payments}/></div><div className="modal-actions"><button className="secondary-button" onClick={()=>window.print()}><Printer size={16}/> Print Receipt</button><button className="primary-button" onClick={downloadReceipt}><Download size={16}/> Download PDF</button></div></Modal>
      <Modal open={!!paymentStudent} title={`Record Payment — ${paymentStudent?.name||"Student"}`} onClose={()=>setPaymentStudent(null)}><form className="payment-form" onSubmit={save}><div className="fee-modal-summary"><div><span>Monthly Fee</span><strong>{money(monthSummary.amount)}</strong></div><div><span>Already Paid</span><strong className="paid">{money(monthSummary.paid)}</strong></div><div><span>Remaining</span><strong className="due">{money(monthSummary.remaining)}</strong></div></div><div className="form-grid"><div className="field full-span"><label>Student</label><input value={paymentStudent?.name||""} disabled/></div>
          <div className="field full-span"><label>Collected By</label><input value={getSession()?.name ? `${getSession().name} (${getSession().role || "admin"})` : "Current user"} disabled/></div><div className="field"><label>Fee Month *</label><input type="month" value={form.feeMonth} onChange={e=>setForm({...form,feeMonth:e.target.value})} required/></div><div className="field"><label>Amount Being Paid *</label><input type="number" min="1" max={monthSummary.remaining} value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></div><div className="field"><label>Payment Date *</label><input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required/></div><div className="field"><label>Payment Mode *</label><select value={form.mode} onChange={e=>setForm({...form,mode:e.target.value})}><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Card</option><option>Other</option></select></div><div className="field"><label>Transaction / Reference</label><input value={form.reference} onChange={e=>setForm({...form,reference:e.target.value})} placeholder="Optional"/></div><div className="field full-span"><label>Notes</label><textarea rows="2" value={form.note} onChange={e=>setForm({...form,note:e.target.value})} placeholder="Optional"/></div></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setPaymentStudent(null)}>Cancel</button><button className="primary-button"><Plus size={16}/> Record Payment</button></div></form></Modal>
    </div>
  </AppLayout>;
}
