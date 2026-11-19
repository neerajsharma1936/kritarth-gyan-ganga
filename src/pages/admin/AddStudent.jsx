import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { addStudent } from "../../lib/studentService";

const initial = {
  name:"", fatherName:"", phone:"", email:"", aadhaar:"", parentName:"", parentWhatsApp:"", parentPhone:"", parentEmail:"",
  className:"Class 10", section:"A", monthlyFee:"2000",
  feeStartMonth:new Date().toISOString().slice(0,7),
  totalFees:"24000", paidFees:"0", lastPaymentDate:"",
  admissionDate:new Date().toISOString().slice(0,10), address:"", photo:""
};

export default function AddStudent() {
  const [form,setForm]=useState(initial);
  const [error,setError]=useState("");
  const navigate=useNavigate();

  function change(e) {
    const {name,value}=e.target;
    if(name==="monthlyFee") {
      setForm({...form, monthlyFee:value, totalFees:String((Number(value)||0)*12)});
    } else setForm({...form,[name]:value});
  }

  function photoChange(e) {
    const file=e.target.files?.[0];
    if(!file) return;
    if(file.size > 2*1024*1024) { setError("Photo must be smaller than 2 MB."); return; }
    const reader=new FileReader();
    reader.onload=()=>setForm(prev=>({...prev,photo:reader.result}));
    reader.readAsDataURL(file);
  }

  async function submit(e) {
    e.preventDefault(); setError("");
    if(Number(form.paidFees)>Number(form.totalFees)) return setError("Paid fees cannot be greater than total fees.");
    if(!form.name.trim()||!form.phone.trim()||!form.monthlyFee) return setError("Please fill all required fields.");
    try {
      const student = await addStudent({...form,totalFees:Number(form.totalFees),paidFees:Number(form.paidFees),monthlyFee:Number(form.monthlyFee)});
      navigate(`/admin/students/${student.id}`);
    } catch (err) { setError(err.message || "Unable to save the student to Supabase."); }
  }

  return (
    <AppLayout title="Register Student" subtitle="Create a student profile and 12-month fee plan">
      <form className="panel form-panel" onSubmit={submit}>
        <div className="section-heading"><h2>Student Information</h2><p>Roll number is generated automatically. Photo will appear on profile and ID card.</p></div>
        <div className="registration-photo-row">
          <div className="photo-preview">{form.photo ? <img src={form.photo} alt="Student preview"/> : <span>{form.name?.charAt(0)||"?"}</span>}</div>
          <div className="field"><label>Student Photo</label><input type="file" accept="image/*" onChange={photoChange}/><small>JPG/PNG, up to 2 MB.</small></div>
        </div>
        <div className="form-grid">
          <Field label="Student Name *" name="name" value={form.name} onChange={change}/>
          <Field label="Father's Name" name="fatherName" value={form.fatherName} onChange={change}/>
          <Field label="Phone Number *" name="phone" value={form.phone} onChange={change}/>
          <Field label="Email" type="email" name="email" value={form.email} onChange={change}/>
          <Field label="Parent / Guardian Name" name="parentName" value={form.parentName} onChange={change}/>
          <Field label="Parent WhatsApp Number" name="parentWhatsApp" value={form.parentWhatsApp} onChange={change}/>
          <Field label="Parent Phone Number" name="parentPhone" value={form.parentPhone} onChange={change}/>
          <Field label="Parent Email Address" type="email" name="parentEmail" value={form.parentEmail} onChange={change}/>
          <Field label="Aadhaar Number" name="aadhaar" value={form.aadhaar} onChange={change}/>
          <div className="field"><label>Class *</label><select name="className" value={form.className} onChange={change}>{["Nursery","LKG","UKG",...Array.from({length:12},(_,i)=>`Class ${i+1}`)].map(x=><option key={x}>{x}</option>)}</select></div>
          <div className="field"><label>Section</label><select name="section" value={form.section} onChange={change}>{["A","B","C","D"].map(x=><option key={x}>{x}</option>)}</select></div>
          <Field label="Admission Date" type="date" name="admissionDate" value={form.admissionDate} onChange={change}/>
          <Field label="Monthly Fee *" type="number" name="monthlyFee" value={form.monthlyFee} onChange={change}/>
          <Field label="Fee Plan Starts" type="month" name="feeStartMonth" value={form.feeStartMonth} onChange={change}/>
          <Field label="1-Year Fee (automatic)" type="number" name="totalFees" value={form.totalFees} onChange={change} readOnly/>
          <Field label="Already Paid" type="number" name="paidFees" value={form.paidFees} onChange={change}/>
          <Field label="Last Payment Date" type="date" name="lastPaymentDate" value={form.lastPaymentDate} onChange={change}/>
          <div className="field full-span"><label>Address</label><textarea name="address" value={form.address} onChange={change} rows="3"/></div>
        </div>
        {error&&<div className="error-box">{error}</div>}
        <div className="form-actions"><button type="button" className="secondary-button" onClick={()=>navigate("/admin/students")}>Cancel</button><button className="primary-button">Register Student</button></div>
      </form>
    </AppLayout>
  );
}
function Field({label,...props}) { return <div className="field"><label>{label}</label><input {...props}/></div>; }
