import { useState } from "react";
import { ArrowLeft, Save, Camera } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { addTeacher, getTeachers, saveTeachers } from "../../utils/storage";

const empty = { name:"", photo:"", gender:"", dateOfBirth:"", address:"", qualification:"", subjects:"", classes:"", experience:"", joiningDate:new Date().toISOString().slice(0,10), employmentStatus:"Active", whatsapp:"", phone:"", email:"", emergencyContact:"", monthlySalary:"", salaryPaymentDate:"", salaryStatus:"Pending", salaryNotes:"" };
export default function TeacherForm() {
  const { id } = useParams(); const navigate=useNavigate();
  const existing = id ? getTeachers().find(t=>t.id===id) : null;
  const [form,setForm]=useState(existing ? {...existing, subjects:Array.isArray(existing.subjects)?existing.subjects.join(", "):existing.subjects||"", classes:Array.isArray(existing.classes)?existing.classes.join(", "):existing.classes||""} : empty);
  const [error,setError]=useState("");
  const set=(key,value)=>setForm(f=>({...f,[key]:value}));
  function photoChange(e){ const file=e.target.files?.[0]; if(!file)return; if(file.size>2*1024*1024){setError("Photo must be smaller than 2 MB.");return;} const r=new FileReader(); r.onload=()=>set("photo",r.result); r.readAsDataURL(file); }
  function submit(e){ e.preventDefault(); setError(""); if(!form.name.trim()) return setError("Teacher name is required."); if(!form.phone.trim()) return setError("Phone number is required."); const teachers=getTeachers();
    const normalized={...form, subjects:form.subjects.split(",").map(x=>x.trim()).filter(Boolean), classes:form.classes.split(",").map(x=>x.trim()).filter(Boolean), experience:Number(form.experience||0), monthlySalary:Number(form.monthlySalary||0)};
    if(existing){ saveTeachers(teachers.map(t=>t.id===existing.id?{...t,...normalized}:t)); navigate(`/admin/teachers/${existing.id}`); } else { const t=addTeacher(normalized); navigate(`/admin/teachers/${t.id}`); }
  }
  return <AppLayout title={existing?"Edit Teacher":"Add Teacher"} subtitle={existing?`Update ${existing.name}'s profile` : "Create a complete teacher profile"}>
    <Link to="/admin/teachers" className="back-link"><ArrowLeft size={17}/> Back to Teachers</Link>
    <form className="panel form-panel" onSubmit={submit}>
      <div className="section-heading"><h2>Personal Details</h2><p>Basic identity and profile information</p></div>
      <div className="form-grid">
        <div className="field"><label>Teacher ID</label><input value={existing?.teacherId || "Auto-generated on save"} disabled /></div><div className="field"><label>Full Name *</label><input value={form.name} onChange={e=>set("name",e.target.value)} /></div>
        <div className="field"><label>Profile Photo</label><input type="file" accept="image/*" onChange={photoChange}/>{form.photo&&<div className="photo-preview"><img src={form.photo} alt="Preview"/></div>}</div><div className="field"><label>Gender</label><select value={form.gender} onChange={e=>set("gender",e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div>
        <div className="field"><label>Date of Birth</label><input type="date" value={form.dateOfBirth||""} onChange={e=>set("dateOfBirth",e.target.value)}/></div><div className="field"><label>Joining Date</label><input type="date" value={form.joiningDate||""} onChange={e=>set("joiningDate",e.target.value)}/></div>
        <div className="field full-span"><label>Address</label><textarea value={form.address||""} onChange={e=>set("address",e.target.value)} rows="2"/></div>
      </div>
      <div className="section-heading form-section"><h2>Professional Details</h2><p>Subjects, classes and employment</p></div>
      <div className="form-grid">
        <div className="field"><label>Qualification</label><input value={form.qualification||""} onChange={e=>set("qualification",e.target.value)}/></div><div className="field"><label>Years of Experience</label><input type="number" min="0" value={form.experience||""} onChange={e=>set("experience",e.target.value)}/></div>
        <div className="field"><label>Subjects <span className="muted">comma separated</span></label><input value={form.subjects||""} onChange={e=>set("subjects",e.target.value)} placeholder="Math, Physics"/></div><div className="field"><label>Classes Taught <span className="muted">comma separated</span></label><input value={form.classes||""} onChange={e=>set("classes",e.target.value)} placeholder="9th, 10th"/></div>
        <div className="field"><label>Employment Status</label><select value={form.employmentStatus||"Active"} onChange={e=>set("employmentStatus",e.target.value)}><option>Active</option><option>Inactive</option></select></div>
      </div>
      <div className="section-heading form-section"><h2>Contact Details</h2><p>Use these for direct communication</p></div>
      <div className="form-grid">
        <div className="field"><label>WhatsApp Number</label><input value={form.whatsapp||""} onChange={e=>set("whatsapp",e.target.value)}/></div><div className="field"><label>Phone Number *</label><input value={form.phone||""} onChange={e=>set("phone",e.target.value)}/></div><div className="field"><label>Email</label><input type="email" value={form.email||""} onChange={e=>set("email",e.target.value)}/></div><div className="field"><label>Emergency Contact</label><input value={form.emergencyContact||""} onChange={e=>set("emergencyContact",e.target.value)}/></div>
      </div>
      <div className="section-heading form-section"><h2>Salary Details</h2><p>Monthly payroll configuration</p></div>
      <div className="form-grid"><div className="field"><label>Monthly Salary</label><input type="number" min="0" value={form.monthlySalary||""} onChange={e=>set("monthlySalary",e.target.value)}/></div><div className="field"><label>Salary Payment Date</label><input type="number" min="1" max="31" value={form.salaryPaymentDate||""} onChange={e=>set("salaryPaymentDate",e.target.value)}/></div><div className="field"><label>Salary Status</label><select value={form.salaryStatus||"Pending"} onChange={e=>set("salaryStatus",e.target.value)}><option>Paid</option><option>Partial</option><option>Pending</option></select></div><div className="field"><label>Salary Notes</label><input value={form.salaryNotes||""} onChange={e=>set("salaryNotes",e.target.value)}/></div></div>
      {error&&<div className="error-box">{error}</div>}<div className="form-actions"><Link className="secondary-button" to="/admin/teachers">Cancel</Link><button className="primary-button" type="submit"><Save size={17}/> {existing?"Save Changes":"Create Teacher"}</button></div>
    </form>
  </AppLayout>;
}
