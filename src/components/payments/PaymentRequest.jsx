import { useMemo, useState } from "react";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import { currency } from "../../utils/format";
import { academicYearMonths, academicYearStartYear, getMonthStatus } from "../../utils/monthlyFees";
import { getPayments } from "../../utils/storage";

function normalizePhone(value){return String(value||"").replace(/\D/g,"")}
function monthsFor(student){const currentMonth=new Date().toISOString().slice(0,7);return academicYearMonths(academicYearStartYear(currentMonth)).map(x=>x.key)}
function label(key){return new Date(`${key}-01T00:00:00`).toLocaleDateString("en-IN",{month:"long",year:"numeric"})}

export default function PaymentRequest({student}){
 const payments=getPayments(); const months=monthsFor(student); const [month,setMonth]=useState(months.find(m=>getMonthStatus(student,m,payments).remaining>0)||months[months.length-1]);
 const summary=useMemo(()=>getMonthStatus(student,month,payments),[student,month,payments]);
 const parent=student.parentName||student.fatherName||"Parent/Guardian"; const whatsapp=normalizePhone(student.parentWhatsApp); const phone=normalizePhone(student.parentPhone||student.phone); const email=String(student.parentEmail||student.email||"").trim();
 const message=`Hello ${parent},\n\nThis is a fee payment reminder from Kritarth Gyan Ganga.\n\nStudent: ${student.name}\nRoll No: ${student.rollNo}\nClass: ${student.className} - ${student.section||""}\nFee Month: ${label(month)}\nMonthly Fee: ${currency(summary.amount)}\nPaid: ${currency(summary.paid)}\nRemaining: ${currency(summary.remaining)}\n\nPlease complete the pending tuition fee at your earliest convenience.\n\nThank you,\nKritarth Gyan Ganga`;
 const emailSubject=`Tuition Fee Payment Reminder - ${student.name} - ${label(month)}`; const emailBody=message;
 function openWhatsApp(){if(!whatsapp)return alert("A valid parent WhatsApp number is not available.");window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`,"_blank","noopener,noreferrer")}
 function openEmail(){if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return alert("A valid parent email address is not available.");window.location.href=`mailto:${email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
 function openPhone(){if(!phone)return alert("A valid parent phone number is not available.");window.location.href=`tel:${phone}`}
 return <div className="payment-request"><div className="request-receipt"><div className="request-head"><div className="request-logo"><Send size={21}/></div><div><strong>Send Fee Payment Request</strong><span>Manual contact — nothing is sent automatically</span></div></div>
   <div className="request-student"><div><span>Student</span><strong>{student.name}</strong></div><div><span>Parent / Guardian</span><strong>{parent}</strong></div><div><span>Fee Month</span><select value={month} onChange={e=>setMonth(e.target.value)}>{months.map(m=><option key={m} value={m}>{label(m)}</option>)}</select></div></div>
   <div className="request-amount"><span>Monthly Fee</span><strong>{currency(summary.amount)}</strong><div className="request-balance"><span>Paid {currency(summary.paid)}</span><span>Remaining {currency(summary.remaining)}</span></div></div>
   <div className="request-methods"><h4>Contact Parent</h4><button type="button" className="method-option" onClick={openWhatsApp}><span className="request-icon whatsapp"><MessageCircle size={18}/></span><span><strong>WhatsApp</strong><small>Open chat with a pre-filled reminder</small></span></button><button type="button" className="method-option" onClick={openEmail}><span className="request-icon email"><Mail size={18}/></span><span><strong>Email</strong><small>Open default email app with subject and body</small></span></button><button type="button" className="method-option" onClick={openPhone}><span className="request-icon phone"><Phone size={18}/></span><span><strong>Phone</strong><small>Open the phone dialer</small></span></button></div>
   <div className="request-footer"><span>Parent contact details are taken from the student profile.</span><span>Kritarth Gyan Ganga</span></div>
 </div></div>;
}
