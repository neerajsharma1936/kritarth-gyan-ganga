import { IndianRupee, CalendarDays, CheckCircle2, Send } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import Modal from "../../components/common/Modal";
import PaymentRequest from "../../components/payments/PaymentRequest";
import { useState } from "react";
import { getPayments, getSession, getStudents } from "../../utils/storage";
import { currency, dateFormat, remainingFees } from "../../utils/format";

export default function StudentDashboard() {
  const [showRequest,setShowRequest]=useState(false);
  const session = getSession();
  const student = getStudents().find(s => s.id === session?.studentId);
  const payments = getPayments().filter(p => p.studentId === student?.id).sort((a,b) => b.date.localeCompare(a.date));

  if (!student) return <AppLayout role="student" title="Dashboard"><div className="panel empty-state">Student profile not found.</div></AppLayout>;

  const progress = student.totalFees ? Math.min((student.paidFees / student.totalFees) * 100, 100) : 0;

  return (
    <AppLayout role="student" title="My Dashboard" subtitle="View your tuition and payment information">
      <section className="student-welcome panel">
        <div><span className="eyebrow">WELCOME BACK</span><h2>{student.name} 👋</h2><p>{student.rollNo} · Class {student.className} - {student.section}</p></div>
        <div className="student-progress"><strong>{Math.round(progress)}%</strong><span>Fees paid</span></div>
      </section>

      <button className="primary-button payment-request-btn" onClick={()=>setShowRequest(true)}><Send size={17}/> Request / Pay Monthly Fee</button>

      <section className="stats-grid three">
        <div className="fee-summary"><span>Total Fees</span><strong>{currency(student.totalFees)}</strong><IndianRupee size={22}/></div>
        <div className="fee-summary"><span>Paid</span><strong>{currency(student.paidFees)}</strong><CheckCircle2 size={22}/></div>
        <div className="fee-summary"><span>Remaining</span><strong>{currency(remainingFees(student))}</strong><IndianRupee size={22}/></div>
      </section>

      <section className="panel table-panel">
        <div className="panel-head"><div><h2>My Payment History</h2><p>Your recorded tuition fee payments</p></div></div>
        <div className="table-wrap"><table><thead><tr><th>Payment ID</th><th>Date</th><th>Amount</th><th>Mode</th><th>Note</th></tr></thead>
        <tbody>{payments.map(p => <tr key={p.id}><td>{p.id}</td><td><CalendarDays size={15} className="inline-icon" /> {dateFormat(p.date)}</td><td className="paid">{currency(p.amount)}</td><td>{p.mode}</td><td>{p.note}</td></tr>)}{payments.length === 0 && <tr><td colSpan="5" className="empty">No payments recorded.</td></tr>}</tbody></table></div>
      </section>
      <Modal open={showRequest} title="Monthly Fee Payment Request" onClose={()=>setShowRequest(false)}><PaymentRequest student={student} monthlyFee={Number(student.monthlyFee||Number(student.totalFees)/12)} month={new Date().toLocaleString("en-IN",{month:"long",year:"numeric"})}/></Modal>
    </AppLayout>
  );
}