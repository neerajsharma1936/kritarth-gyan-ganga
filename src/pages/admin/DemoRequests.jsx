import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Eye, GraduationCap, MessageCircle, Phone, Plus, Search, UserPlus, X } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { addDemoRequest, getDemoRequests, updateDemoRequest } from "../../utils/storage";

const classes = ["Nursery","LKG","UKG",...Array.from({length:12},(_,i)=>`Class ${i+1}`)];
const subjects = ["Mathematics","Science","Physics","Chemistry","English","Hindi","Computer Science","Social Studies","Other"];
const statuses = ["New","Contacted","Scheduled","Converted","Closed"];

const blankForm = { name:"", parent:"", className:"", subject:"", phone:"", email:"", preferredDate:"", preferredTime:"", mode:"Online", notes:"" };

export default function DemoRequests(){
  const [requests,setRequests]=useState(getDemoRequests());
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("All");
  const [selectedId,setSelectedId]=useState(requests[0]?.id||"");
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState(blankForm);
  const [message,setMessage]=useState("");

  const filtered=useMemo(()=>requests.filter(r=>{
    const q=query.trim().toLowerCase();
    const matchesQuery=!q || [r.name,r.parent,r.phone,r.email,r.className,r.subject].some(v=>String(v||"").toLowerCase().includes(q));
    return matchesQuery && (status==="All" || r.status===status);
  }),[requests,query,status]);
  const selected=requests.find(r=>r.id===selectedId) || filtered[0] || requests[0];

  function refresh(){setRequests(getDemoRequests());}
  function setRequestStatus(id,next){ updateDemoRequest(id,{status:next}); refresh(); setSelectedId(id); }
  function submit(e){
    e.preventDefault();
    const created=addDemoRequest(form);
    setRequests(getDemoRequests());
    setSelectedId(created.id);
    setForm(blankForm);
    setMessage("Demo request added successfully.");
  }

  return <AppLayout title="Demo Class Requests" subtitle="Manage new demo requests, follow-ups and demo class scheduling.">
    <div className="demo-page">
      <div className="page-actions demo-page-actions">
        <div className="action-group demo-filters">
          <div className="search-box"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search student, parent or phone..."/></div>
          <select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option>{statuses.map(s=><option key={s}>{s}</option>)}</select>
        </div>
        <button className="primary-button" onClick={()=>{setMessage("");setForm(blankForm);setShowForm(true)}}><Plus size={15}/> New Demo Request</button>
      </div>

      <div className="demo-summary-grid">
        <Summary title="Total Requests" value={requests.length} tone="blue" />
        <Summary title="New" value={requests.filter(r=>r.status==="New").length} tone="yellow" />
        <Summary title="Contacted" value={requests.filter(r=>r.status==="Contacted").length} tone="purple" />
        <Summary title="Scheduled" value={requests.filter(r=>r.status==="Scheduled").length} tone="green" />
      </div>

      <div className="demo-page-grid">
        <section className="panel">
          <div className="panel-head"><div><h2><GraduationCap size={18}/> New Demo Requests</h2><p>All demo enquiries submitted through your tuition system.</p></div><span className="demo-count">{filtered.length} requests</span></div>
          <div className="table-wrap">
            <table className="demo-request-table">
              <thead><tr><th>Student</th><th>Parent</th><th>Class</th><th>Subject</th><th>Phone</th><th>Preferred Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{filtered.length ? filtered.map(r=><tr key={r.id} className={selected?.id===r.id?"selected-row":""} onClick={()=>setSelectedId(r.id)}>
                <td><strong>{r.name}</strong><span>{r.email||"No email"}</span></td><td>{r.parent}</td><td>{r.className}</td><td>{r.subject}</td><td><a href={`tel:${r.phone}`} className="phone-link"><Phone size={12}/>{r.phone}</a></td><td>{r.preferredDate||"—"}{r.preferredTime?` • ${r.preferredTime}`:""}</td><td><span className={`demo-status ${String(r.status).toLowerCase()}`}>{r.status}</span></td><td><button className="demo-view-btn" onClick={e=>{e.stopPropagation();setSelectedId(r.id)}}><Eye size={12}/> View</button></td>
              </tr>):<tr><td colSpan="8"><div className="empty-demo">No demo requests found.</div></td></tr>}</tbody>
            </table>
          </div>
        </section>

        <section className="panel demo-request-details">
          <div className="panel-head"><div><h2>Demo Class Details</h2><p>{selected?"Selected request details":"Select a request to view details"}</p></div></div>
          {selected ? <div className="request-detail-content">
            <div className="request-detail-top"><div className="demo-avatar">{selected.name.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase()}</div><div><h3>{selected.name}</h3><span>{selected.className} • {selected.subject}</span></div><span className={`demo-status ${String(selected.status).toLowerCase()}`}>{selected.status}</span></div>
            <div className="request-info-grid">
              <Info label="Parent Name" value={selected.parent}/><Info label="Phone" value={selected.phone}/><Info label="WhatsApp" value={selected.phone}/><Info label="Email" value={selected.email||"—"}/><Info label="Preferred Date" value={selected.preferredDate||"—"}/><Info label="Preferred Time" value={selected.preferredTime||"—"}/><Info label="Mode" value={selected.mode||"Online"}/><Info label="Notes" value={selected.notes||"—"}/>
            </div>
            <div className="detail-actions-grid">
              <a href={`tel:${selected.phone}`} className="detail-action green"><Phone size={15}/> Call Parent</a>
              <a href={`https://wa.me/91${String(selected.phone).replace(/\D/g,"")}`} target="_blank" rel="noreferrer" className="detail-action green"><MessageCircle size={15}/> WhatsApp</a>
              <button className="detail-action blue" onClick={()=>setRequestStatus(selected.id,"Scheduled")}><CalendarDays size={15}/> Schedule Demo</button>
              <Link to="/admin/teachers" className="detail-action purple"><UserPlus size={15}/> Assign Teacher</Link>
              <Link to="/admin/students/new" className="detail-action red"><CheckCircle2 size={15}/> Convert to Student</Link>
            </div>
            <div className="status-update"><span>Update Status</span><div>{statuses.map(s=><button key={s} className={selected.status===s?"active":""} onClick={()=>setRequestStatus(selected.id,s)}>{s}</button>)}</div></div>
          </div> : <div className="empty-detail">Select a demo request from the list.</div>}
        </section>
      </div>
    </div>

    {showForm && <div className="admin-modal-backdrop" onMouseDown={()=>setShowForm(false)}><div className="admin-modal demo-form-modal" onMouseDown={e=>e.stopPropagation()}><div className="admin-modal-head"><div><h2>New Demo Request</h2><p>Add a demo enquiry manually.</p></div><button onClick={()=>setShowForm(false)}><X size={18}/></button></div><form className="demo-request-form" onSubmit={submit}>
      <label>Student Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Enter student name"/></label>
      <label>Parent Name<input required value={form.parent} onChange={e=>setForm({...form,parent:e.target.value})} placeholder="Enter parent name"/></label>
      <div className="form-grid"><label>Class<select required value={form.className} onChange={e=>setForm({...form,className:e.target.value})}><option value="">Select Class</option>{classes.map(c=><option key={c}>{c}</option>)}</select></label><label>Subject<select required value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}><option value="">Select Subject</option>{subjects.map(s=><option key={s}>{s}</option>)}</select></label></div>
      <div className="form-grid"><label>Phone<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="Parent phone number"/></label><label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="parent@example.com"/></label></div>
      <div className="form-grid"><label>Preferred Date<input type="date" value={form.preferredDate} onChange={e=>setForm({...form,preferredDate:e.target.value})}/></label><label>Preferred Time<input type="time" value={form.preferredTime} onChange={e=>setForm({...form,preferredTime:e.target.value})}/></label></div>
      <label>Mode<select value={form.mode} onChange={e=>setForm({...form,mode:e.target.value})}><option>Online</option><option>Offline</option></select></label>
      <label>Notes<textarea rows="3" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Optional notes"/></label>
      {message && <div className="admin-form-message"><CheckCircle2 size={15}/>{message}</div>}
      <div className="admin-form-actions"><button type="button" className="secondary-button" onClick={()=>setShowForm(false)}>Cancel</button><button type="submit" className="primary-button">Create Demo Request</button></div>
    </form></div></div>}
  </AppLayout>
}
function Summary({title,value,tone}){return <div className={`demo-summary-card ${tone}`}><span>{title}</span><strong>{value}</strong></div>}
function Info({label,value}){return <div className="request-info"><span>{label}</span><strong>{value}</strong></div>}
