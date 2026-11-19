import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, CalendarDays, IndianRupee, Phone, Mail, MapPin, Plus,
  Pencil, Trash2, Download, Camera, Send, MessageCircle, Printer,
  Eye, Users, CreditCard, FileText, CheckCircle2, Clock3
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import logo from "../../assets/kritarth-gyan-ganga-logo.png";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import Receipt from "../../components/receipts/Receipt";
import PaymentRequest from "../../components/payments/PaymentRequest";
import { addPayment, getPayments, reversePayment } from "../../utils/storage";
import { getStudentById, archiveStudent, updateStudent } from "../../lib/studentService";
import { currency, dateFormat } from "../../utils/format";
import { academicYearMonths, academicYearStartYear, academicYearLabel, classForMonth, getMonthStatus, getStudentTotalPaid, monthlyFeeAmount } from "../../utils/monthlyFees";

function monthsFor(student) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  return academicYearMonths(academicYearStartYear(currentMonth));
}
function waLink(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "#";
}

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const receiptRef = useRef(null);
  const [refresh, setRefresh] = useState(0);
  const [student, setStudent] = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentError, setStudentError] = useState("");

  useEffect(() => {
    let active = true;
    setStudentLoading(true); setStudentError("");
    getStudentById(id)
      .then((record) => { if (active) { setStudent(record); setEditForm(record); } })
      .catch((error) => { if (active) setStudentError(error.message || "Unable to load this student from Supabase."); })
      .finally(() => { if (active) setStudentLoading(false); });
    return () => { active = false; };
  }, [id]);
  const payments = useMemo(
    () => getPayments().filter((p) => p.studentId === id).sort((a, b) => String(b.date).localeCompare(String(a.date))),
    [id, refresh]
  );

  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showPaymentRequest, setShowPaymentRequest] = useState(false);
  const [showIdCard, setShowIdCard] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [historyYear, setHistoryYear] = useState(academicYearStartYear(new Date().toISOString().slice(0, 7)));
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [form, setForm] = useState({ feeMonth: "", amount: "", date: new Date().toISOString().slice(0, 10), mode: "UPI", reference: "", note: "" });
  const [promotionForm, setPromotionForm] = useState({ className: "", monthlyFee: "", effectiveFrom: "" });
  const [editForm, setEditForm] = useState({});

  if (studentLoading) return <AppLayout title="Student Profile"><div className="panel">Loading student from Supabase...</div></AppLayout>;
  if (!student) return <AppLayout title="Student Not Found"><div className="panel empty-state">{studentError || "Student record not found."}</div></AppLayout>;

  const currentAcademicYear = academicYearStartYear(new Date().toISOString().slice(0, 7));
  const knownYears = Array.from(new Set([currentAcademicYear, ...((student.feeHistory || []).map(x => academicYearStartYear(x.effectiveFrom))), historyYear, currentAcademicYear - 1, currentAcademicYear + 1])).filter(Number.isFinite).sort((a,b)=>a-b);
  const viewedMonths = academicYearMonths(historyYear);
  const months = viewedMonths;
  const monthlyFee = monthlyFeeAmount(student, new Date().toISOString().slice(0, 7));
  const totalPaid = getStudentTotalPaid(student, payments, historyYear);
  const annualFee = months.reduce((sum, m) => sum + getMonthStatus(student, m.key, payments).amount, 0);
  const outstanding = Math.max(annualFee - totalPaid, 0);
  const overallStatus = outstanding === 0 && annualFee > 0 ? "PAID" : totalPaid > 0 ? "PARTIAL" : "DUE";

  async function downloadIdCard() {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: null });
    const a = document.createElement("a");
    a.download = `${student.rollNo}-${student.name.replace(/\s+/g, "-")}-ID-Card.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }
  async function downloadReceipt() {
    if (!receiptRef.current || !selectedPayment) return;
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
      pdf.save(`Kritarth-Gyan-Ganga-Fee-Receipt-${selectedPayment.id || "RECEIPT"}.pdf`);
    } finally {
      exportNode.remove();
    }
  }
  function openMonthPayment(row) {
    const s = getMonthStatus(student, row.key, payments);
    setForm({ feeMonth: row.key, amount: s.remaining ? String(s.remaining) : "", date: new Date().toISOString().slice(0, 10), mode: "UPI", reference: "", note: `${row.label} tuition fee` });
    setShowPayment(true);
  }
  function openAddPayment() {
    const firstDue = months.find((m) => getMonthStatus(student, m.key, payments).remaining > 0) || months[0];
    const s = getMonthStatus(student, firstDue.key, payments);
    setForm({ feeMonth: firstDue.key, amount: s.remaining ? String(s.remaining) : "", date: new Date().toISOString().slice(0, 10), mode: "UPI", reference: "", note: "Monthly tuition fee" });
    setShowPayment(true);
  }
  function submitPayment(e) {
    e.preventDefault();
    const amount = Number(form.amount || 0);
    const s = getMonthStatus(student, form.feeMonth, payments);
    if (amount <= 0) return alert("Payment amount must be greater than ₹0.");
    if (amount > s.remaining) return alert(`Amount cannot exceed the remaining ${currency(s.remaining)} for ${form.feeMonth}.`);
    if (!form.date || !form.mode || !form.feeMonth) return alert("Please fill all required payment fields.");
    addPayment({ studentId: id, amount, date: form.date, mode: form.mode, reference: form.reference.trim(), note: form.note.trim() || "Monthly tuition fee", feeMonth: form.feeMonth });
    setShowPayment(false);
    setRefresh((v) => v + 1);
  }
  function photoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Photo must be smaller than 2 MB.");
    const reader = new FileReader();
    reader.onload = () => setEditForm((prev) => ({ ...prev, photo: reader.result }));
    reader.readAsDataURL(file);
  }
  async function savePromotion(e) {
    e.preventDefault();
    const nextClass = promotionForm.className;
    const nextFee = Number(promotionForm.monthlyFee || 0);
    if (!nextClass || nextFee <= 0 || !promotionForm.effectiveFrom) return alert("Please select the new class, monthly fee and effective month.");
    if (promotionForm.effectiveFrom <= student.feeStartMonth && nextClass === student.className) return alert("Choose a new effective month for the promotion.");
    try {
      const updated = await updateStudent(id, { ...promotionForm, feeEffectiveFrom: promotionForm.effectiveFrom, monthlyFee: nextFee });
      setStudent(updated); setHistoryYear(academicYearStartYear(promotionForm.effectiveFrom));
      setShowPromotion(false); setEditForm(updated); setRefresh(v => v + 1);
    } catch (error) { alert(error.message || "Unable to promote this student."); }
  }
  async function saveEdit(e) {
    e.preventDefault();
    const monthly = Number(editForm.monthlyFee || 0);
    if (monthly <= 0) return alert("Monthly fee must be greater than ₹0.");
    const classChanged = editForm.className !== student.className;
    const feeChanged = monthly !== Number(student.monthlyFee || 0);
    const effectiveFrom = (classChanged || feeChanged)
      ? (editForm.feeStartMonth && editForm.feeStartMonth !== student.feeStartMonth
          ? editForm.feeStartMonth
          : new Date().toISOString().slice(0, 7))
      : student.feeStartMonth;
    try {
      const updated = await updateStudent(id, { ...editForm, monthlyFee: monthly, totalFees: monthly * 12, feeEffectiveFrom: effectiveFrom });
      setStudent(updated); setEditForm(updated); setShowEdit(false); setRefresh((v) => v + 1);
    } catch (error) { alert(error.message || "Unable to update this student."); }
  }
  async function confirmArchive() {
    try { await archiveStudent(id); navigate("/admin/students"); }
    catch (error) { alert(error.message || "Unable to archive this student."); }
  }
  function confirmPermanentDelete() {
    if (!window.confirm(`PERMANENTLY DELETE ${student.name}? This will remove the student profile, all previous-class history, fee plans, and every payment/receipt record. This action cannot be undone.`)) return;
    alert("Permanent deletion is temporarily unavailable while student records are being migrated. Please archive this student instead.");
  }

  return (
    <AppLayout title="Student Profile" subtitle={`Student account, contacts and fee activity for ${student.name}`}>
      <div className="student-page-head">
        <Link to="/admin/students" className="back-link"><ArrowLeft size={16} /> Back to Students</Link>
        <div className="student-head-actions">
          <button className="secondary-button" onClick={() => setShowPaymentRequest(true)}><Send size={15} /> Payment Request</button>
          <button className="secondary-button" onClick={() => { setEditForm(student); setShowEdit(true); }}><Pencil size={15} /> Edit Student</button><button className="primary-button" onClick={() => { setPromotionForm({ className: "", monthlyFee: "", effectiveFrom: `${currentAcademicYear + 1}-04` }); setShowPromotion(true); }}><Users size={15} /> Promote Student</button>
          <button className="primary-button" onClick={openAddPayment}><Plus size={16} /> Add Payment</button>
        </div>
      </div>

      <section className="student-hero panel">
        <div className="student-hero-main">
          <div className="profile-photo profile-photo-large">{student.photo ? <img src={student.photo} alt={student.name} /> : <span>{student.name.charAt(0)}</span>}</div>
          <div className="student-identity">
            <div className="student-name-row"><h2>{student.name}</h2><span className={`status ${overallStatus.toLowerCase()}`}>{overallStatus}</span></div>
            <div className="student-meta-row"><span><strong>Roll No:</strong> <span className="roll-link">{student.rollNo}</span></span><span><strong>Class:</strong> {student.className} {student.section ? `(${student.section})` : ""}</span><span><strong>Admission:</strong> {dateFormat(student.admissionDate)}</span></div>
            <div className="student-contact-strip"><span><Phone size={14} /> {student.phone || "Phone not added"}</span><span><Mail size={14} /> {student.email || "Email not added"}</span><span><MapPin size={14} /> {student.address || "Address not added"}</span></div>
          </div>
        </div>
        <div className="hero-actions">
          <button className="hero-outline" onClick={() => setShowIdCard(true)}><CreditCard size={15} /> ID Card</button>
          <button className="hero-danger" onClick={() => setShowDelete(true)}><Trash2 size={15} /> Archive</button><button className="hero-danger" onClick={confirmPermanentDelete} title="Permanently delete student and all payment history"><Trash2 size={15} /> Delete Permanently</button>
        </div>
      </section>

      <section className="student-content-grid">
        <div className="student-main-column">
          <section className="panel monthly-panel student-monthly-panel">
            <div className="panel-head monthly-heading">
              <div><h2><CalendarDays size={17} className="heading-icon" /> Monthly Fees</h2><p>Previous class and fee records stay unchanged. New class months start fresh and remain red until payment is recorded.</p></div>
              <div className="fees-period"><CalendarDays size={15} /> <select value={historyYear} onChange={e => setHistoryYear(Number(e.target.value))}>{knownYears.map(y => <option key={y} value={y}>{academicYearLabel(y)}</option>)}</select></div>
            </div>
            <div className="month-grid student-month-grid">
              {months.map((row) => {
                const s = getMonthStatus(student, row.key, payments);
                return (
                  <div className={`month-card redesigned-month-card ${s.status.toLowerCase()}`} key={row.key}>
                    <div className="month-card-head"><strong>{row.label}</strong><span className={`status ${s.status.toLowerCase()}`}>{s.status}</span></div><div className="month-class-label">{classForMonth(student, row.key)} · {s.plan?.monthlyFee ? currency(s.plan.monthlyFee) : "Fee plan"}</div>
                    <div className="month-primary-amount"><span>Monthly Fee</span><strong>{currency(s.amount)}</strong></div>
                    <div className="month-stat-line"><span>Paid</span><strong>{currency(s.paid)}</strong></div>
                    <div className="month-stat-line"><span>Remaining</span><strong>{currency(s.remaining)}</strong></div>
                    {s.remaining > 0 ? <button className={`month-action ${s.status.toLowerCase()}`} onClick={() => openMonthPayment(row)}><IndianRupee size={13} /> Record Payment</button> : <button className="month-action completed" onClick={() => { const p = payments.find((x) => (x.feeMonth || String(x.date || "").slice(0,7)) === row.key); if (p) { setSelectedPayment(p); setShowReceipt(true); } }}><Eye size={13} /> View Details</button>}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="panel table-panel student-history-panel">
            <div className="panel-head">
              <div><h2><FileText size={17} className="heading-icon" /> Payment History</h2><p>All payment transactions remain permanently linked to this student, including previous academic years and previous classes.</p></div>
              <button className="primary-button" onClick={openAddPayment}><Plus size={16} /> Add Payment</button>
            </div>
            <div className="table-wrap student-table-wrap"><table><thead><tr><th>Payment ID</th><th>Fee Month</th><th>Payment Date</th><th>Amount</th><th>Payment Mode</th><th>Reference No.</th><th>Note</th><th>Status</th><th>Receipt</th></tr></thead><tbody>{payments.length ? payments.map((p) => <tr key={p.id}><td><strong>{p.id}</strong></td><td>{academicYearMonths(academicYearStartYear(p.feeMonth || String(p.date || "").slice(0,7))).find((m) => m.key === (p.feeMonth || String(p.date || "").slice(0,7)))?.label || p.feeMonth || String(p.date || "").slice(0,7)}</td><td><CalendarDays size={13} className="inline-icon" /> {dateFormat(p.date)}</td><td className="paid"><strong>{currency(p.amount)}</strong></td><td><span className="mode-pill">{p.mode}</span></td><td>{p.reference || "-"}</td><td>{p.note || "-"}</td><td>{p.status === "reversed" ? <span className="status overdue">REVERSED</span> : <span className="status paid">ACTIVE</span>}{p.status === "reversed" ? <button className="receipt-view-button" style={{marginLeft:8}} disabled>Reversed</button> : <button className="receipt-view-button" style={{marginLeft:8}} onClick={() => { if (window.confirm("Reverse this payment? The transaction will be retained in history but excluded from fee totals.")) { reversePayment(p.id); setRefresh(v=>v+1); } }}>Reverse</button>}</td><td><button className="receipt-view-button" onClick={() => { setSelectedPayment(p); setShowReceipt(true); }}><Eye size={14} /> View</button></td></tr>) : <tr><td colSpan="9" className="empty">No payments recorded yet.</td></tr>}</tbody></table></div>
            <div className="history-footer"><span>Showing {payments.length ? `1 to ${payments.length}` : 0} of {payments.length} payments</span><Link to="/admin/fees" className="text-link">View All Payments <ArrowLeft size={13} style={{ transform: "rotate(180deg)" }} /></Link></div>
          </section>
        </div>

        <aside className="student-side-column">
          <section className="panel side-card parent-card">
            <div className="side-card-head"><h3><Users size={17} /> Parent / Guardian Contact</h3></div>
            <div className="parent-name-block"><span>Parent Name</span><strong>{student.parentName || student.fatherName || "Not added"}</strong></div>
            <ContactLine icon={<MessageCircle size={14} />} label="WhatsApp" value={student.parentWhatsApp} type="whatsapp" href={waLink(student.parentWhatsApp)} />
            <ContactLine icon={<Phone size={14} />} label="Phone" value={student.parentPhone || student.phone} type="phone" href={student.parentPhone || student.phone ? `tel:${student.parentPhone || student.phone}` : "#"} />
            <ContactLine icon={<Mail size={14} />} label="Email" value={student.parentEmail || student.email} type="email" href={student.parentEmail || student.email ? `mailto:${student.parentEmail || student.email}` : "#"} />
            <div className="contact-button-row"><a className="contact-button whatsapp" href={waLink(student.parentWhatsApp)} target="_blank" rel="noreferrer"><MessageCircle size={15} /> WhatsApp</a><a className="contact-button" href={student.parentPhone || student.phone ? `tel:${student.parentPhone || student.phone}` : "#"}><Phone size={15} /> Call</a><a className="contact-button" href={student.parentEmail || student.email ? `mailto:${student.parentEmail || student.email}` : "#"}><Mail size={15} /> Email</a></div>
          </section>

          <section className="panel side-card request-card">
            <div className="side-card-head"><h3><Send size={17} /> Payment Request</h3></div>
            <p className="side-description">Send a pre-filled fee reminder to the parent without sending anything automatically.</p>
            <button className="primary-button full" onClick={() => setShowPaymentRequest(true)}><Send size={15} /> Send Fee Payment Request</button>
            <div className="request-mini-stats"><div><span>Monthly Fee</span><strong>{currency(monthlyFee)}</strong></div><div><span>Outstanding</span><strong className={outstanding > 0 ? "text-danger" : "text-green"}>{currency(outstanding)}</strong></div></div>
          </section>

          <section className="panel side-card fee-overview-card">
            <div className="side-card-head"><h3><CreditCard size={17} /> Fee Overview</h3></div>
            <OverviewRow label="Monthly Fee" value={currency(monthlyFee)} />
            <OverviewRow label="Annual Fee" value={currency(annualFee)} />
            <OverviewRow label="Total Received" value={currency(totalPaid)} green />
            <OverviewRow label="Outstanding" value={currency(outstanding)} danger={outstanding > 0} />
            <div className="progress-mini"><div className="progress-mini-head"><span>Fee collection</span><strong>{annualFee ? Math.min(Math.round((totalPaid / annualFee) * 100), 100) : 0}%</strong></div><div className="progress-mini-track"><div style={{ width: `${annualFee ? Math.min((totalPaid / annualFee) * 100, 100) : 0}%` }} /></div></div>
          </section>
        </aside>
      </section>

      <Modal open={showPaymentRequest} title="Send Fee Payment Request" onClose={() => setShowPaymentRequest(false)}><PaymentRequest student={student} /></Modal>
      <Modal open={showPayment} title="Record Payment" onClose={() => setShowPayment(false)}><form onSubmit={submitPayment} className="payment-form"><div className="fee-modal-summary"><div><span>Monthly Fee</span><strong>{currency(form.feeMonth ? getMonthStatus(student, form.feeMonth, payments).amount : monthlyFee)}</strong></div><div><span>Already Paid</span><strong className="paid">{currency(form.feeMonth ? getMonthStatus(student, form.feeMonth, payments).paid : 0)}</strong></div><div><span>Remaining</span><strong className="due">{currency(form.feeMonth ? getMonthStatus(student, form.feeMonth, payments).remaining : 0)}</strong></div></div><div className="form-grid"><div className="field full-span"><label>Student</label><input value={student.name} disabled /></div><div className="field"><label>Fee Month *</label><select value={form.feeMonth} onChange={(e) => { const key = e.target.value; const s = getMonthStatus(student, key, payments); setForm({ ...form, feeMonth: key, amount: s.remaining ? String(s.remaining) : "" }); }}>{months.map((m) => <option key={m.key} value={m.key}>{m.fullLabel}</option>)}</select></div><div className="field"><label>Amount Being Paid *</label><input type="number" min="1" max={form.feeMonth ? getMonthStatus(student, form.feeMonth, payments).remaining : monthlyFee} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div><div className="field"><label>Payment Date *</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div><div className="field"><label>Payment Mode *</label><select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Card</option><option>Other</option></select></div><div className="field"><label>Transaction / Reference</label><input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Optional" /></div><div className="field full-span"><label>Notes</label><textarea rows="2" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional" /></div></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowPayment(false)}>Cancel</button><button className="primary-button"><Plus size={16} /> Record Payment</button></div></form></Modal>
      <Modal open={showPromotion} title="Promote Student to Next Class" onClose={() => setShowPromotion(false)}><form onSubmit={savePromotion} className="edit-form"><div className="promotion-warning"><strong>Previous records will not be changed.</strong><span>All payments, receipts and monthly fee records before the promotion date remain linked to the previous class. The new class starts a fresh fee plan from the effective month.</span></div><div className="form-grid"><div className="field"><label>Current Class</label><input value={student.className} disabled /></div><div className="field"><label>New Class *</label><select value={promotionForm.className} onChange={e=>setPromotionForm({...promotionForm,className:e.target.value})}><option value="">Select class</option>{["Nursery","LKG","UKG",...Array.from({length:12},(_,i)=>`Class ${i+1}`)].map(x=><option key={x} value={x}>{x}</option>)}</select></div><div className="field"><label>New Monthly Fee *</label><input type="number" min="1" value={promotionForm.monthlyFee} onChange={e=>setPromotionForm({...promotionForm,monthlyFee:e.target.value})} placeholder="e.g. 1500" /></div><div className="field"><label>Effective From *</label><input type="month" value={promotionForm.effectiveFrom} onChange={e=>setPromotionForm({...promotionForm,effectiveFrom:e.target.value})} /></div></div><div className="promotion-result"><span>After promotion</span><strong>{promotionForm.className || "New Class"}</strong><em>All months from {promotionForm.effectiveFrom || "the selected month"} will start as <b>DUE / red</b> until payments are recorded.</em></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={()=>setShowPromotion(false)}>Cancel</button><button className="primary-button"><Users size={16}/> Promote Student</button></div></form></Modal>
      <Modal open={showEdit} title="Edit Student Profile" onClose={() => setShowEdit(false)}><form onSubmit={saveEdit} className="edit-form"><div className="edit-photo-box"><div className="photo-preview">{editForm.photo ? <img src={editForm.photo} alt="Student" /> : <span>{student.name.charAt(0)}</span>}</div><label className="secondary-button photo-upload"><Camera size={16} /> Change Photo<input type="file" accept="image/*" onChange={photoChange} /></label></div><div className="form-grid"><EditField label="Student Name" name="name" value={editForm.name} set={setEditForm} /><EditField label="Father's Name" name="fatherName" value={editForm.fatherName} set={setEditForm} /><EditField label="Phone" name="phone" value={editForm.phone} set={setEditForm} /><EditField label="Email" name="email" type="email" value={editForm.email} set={setEditForm} /><EditField label="Aadhaar" name="aadhaar" value={editForm.aadhaar} set={setEditForm} /><div className="field"><label>Class</label><select value={editForm.className || "Class 10"} onChange={(e) => setEditForm((prev) => ({ ...prev, className: e.target.value }))}>{["Nursery","LKG","UKG",...Array.from({length:12},(_,i)=>`Class ${i+1}`)].map(x => <option key={x} value={x}>{x}</option>)}</select></div><EditField label="Monthly Fee" name="monthlyFee" type="number" value={editForm.monthlyFee ?? ""} set={setEditForm} /><EditField label="Fee Plan Starts" name="feeStartMonth" type="month" value={editForm.feeStartMonth} set={setEditForm} /><EditField label="Admission Date" name="admissionDate" type="date" value={editForm.admissionDate} set={setEditForm} /><EditField label="Parent / Guardian Name" name="parentName" value={editForm.parentName || editForm.fatherName} set={setEditForm} /><EditField label="Parent WhatsApp Number" name="parentWhatsApp" value={editForm.parentWhatsApp} set={setEditForm} /><EditField label="Parent Phone Number" name="parentPhone" value={editForm.parentPhone || editForm.phone} set={setEditForm} /><EditField label="Parent Email Address" name="parentEmail" type="email" value={editForm.parentEmail} set={setEditForm} /><div className="field full-span"><label>Address</label><textarea rows="3" value={editForm.address || ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} /></div></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowEdit(false)}>Cancel</button><button className="primary-button">Save Changes</button></div></form></Modal>
      <Modal open={showReceipt} title="Fee Receipt" onClose={() => setShowReceipt(false)}><div ref={receiptRef}><Receipt student={student} payment={selectedPayment} payments={payments} /></div><div className="modal-actions"><button className="secondary-button" onClick={() => window.print()}><Printer size={16} /> Print Receipt</button><button className="primary-button" onClick={downloadReceipt}><Download size={16} /> Download PDF</button></div></Modal>
      <Modal open={showIdCard} title="Student ID Card" onClose={() => setShowIdCard(false)}><div className="id-card-modal-content"><div className="id-card" ref={cardRef}><div className="id-card-top"><div className="id-logo"><img src={logo} alt="Kritarth Gyan Ganga logo" /></div><div><strong>Kritarth Gyan Ganga</strong></div></div><div className="id-card-photo">{student.photo ? <img src={student.photo} alt={student.name} /> : <span>{student.name.charAt(0)}</span>}</div><h2>{student.name}</h2><p className="id-role">STUDENT</p><div className="id-card-info"><div><span>ROLL NUMBER</span><strong>{student.rollNo}</strong></div><div><span>CLASS</span><strong>{student.className} - {student.section}</strong></div></div><div className="id-card-bottom">Official Student ID • Kritarth Gyan Ganga</div></div><div className="modal-actions"><button className="primary-button" onClick={downloadIdCard}><Download size={16} /> Download ID Card</button></div></div></Modal>
      <Modal open={showDelete} title="Delete Student" onClose={() => setShowDelete(false)}><div className="delete-confirm"><div className="delete-icon"><Trash2 size={25} /></div><h3>Manage {student.name}</h3><p><strong>Archive:</strong> hides the student from active lists and preserves all previous class, fee and payment history. <strong>Delete Permanently:</strong> permanently removes the student profile and all associated fee/payment history and cannot be undone.</p><div className="modal-actions no-border"><button className="secondary-button" onClick={() => setShowDelete(false)}>Cancel</button><button className="danger-button" onClick={confirmArchive}>Archive Student</button><button className="danger-button permanent-delete-button" onClick={confirmPermanentDelete}>Delete Permanently</button></div></div></Modal>
    </AppLayout>
  );
}

function ContactLine({ icon, label, value, type, href }) {
  const available = Boolean(value);
  return <div className={`parent-contact-line ${type}`}><span className="parent-contact-icon">{icon}</span><div><span>{label}</span>{available ? <a href={href} target={type === "whatsapp" ? "_blank" : undefined} rel={type === "whatsapp" ? "noreferrer" : undefined}>{value}</a> : <strong>Not added</strong>}</div></div>;
}
function OverviewRow({ label, value, green, danger }) { return <div className="overview-row"><span>{label}</span><strong className={green ? "text-green" : danger ? "text-danger" : ""}>{value}</strong></div>; }
function Detail({ label, value }) { return <div className="detail-item"><span>{label}</span><strong>{value || "-"}</strong></div>; }
function EditField({ label, name, value, set, type = "text" }) { return <div className="field"><label>{label}</label><input type={type} value={value || ""} onChange={(e) => set((prev) => ({ ...prev, [name]: e.target.value }))} /></div>; }
