import { useState } from "react";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { addClassSchedule, getClassSchedule, saveClassSchedule } from "../../utils/storage";

const blank={time:"",name:"",teacher:"",room:"",status:"Upcoming",tone:"blue"};
export default function ClassSchedule(){
 const [rows,setRows]=useState(getClassSchedule());
 const [form,setForm]=useState(blank);
 function add(e){e.preventDefault(); if(!form.time||!form.name||!form.teacher)return; const row=addClassSchedule(form); setRows(getClassSchedule()); setForm(blank);}
 function remove(id){const next=rows.filter(r=>r.id!==id); saveClassSchedule(next); setRows(next);}
 return <AppLayout title="Classes & Schedule" subtitle="Manage the classes displayed in Today's Classes on the dashboard.">
  <div className="schedule-page">
   <section className="panel">
    <div className="panel-head"><div><h2><CalendarDays size={18}/> Add Class Schedule</h2><p>Create a class and it will appear on the dashboard.</p></div></div>
    <form className="schedule-form" onSubmit={add}>
      <label>Time<input type="time" required value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label>
      <label>Class / Subject<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Class 8 Mathematics"/></label>
      <label>Teacher<input required value={form.teacher} onChange={e=>setForm({...form,teacher:e.target.value})} placeholder="Teacher name"/></label>
      <label>Room<input value={form.room} onChange={e=>setForm({...form,room:e.target.value})} placeholder="Room 2 / Online"/></label>
      <button className="primary-button" type="submit"><Plus size={15}/> Add Class</button>
    </form>
   </section>
   <section className="panel schedule-list-panel">
    <div className="panel-head"><div><h2>Full Schedule</h2><p>{rows.length} scheduled classes</p></div></div>
    <div className="class-list">{rows.map(c=><div className="class-row" key={c.id}><span className={`class-time ${c.tone||"blue"}`}>{c.time}</span><div className="class-main"><strong>{c.name}</strong><span>{c.teacher}</span></div><span className="class-room">{c.room||"—"}</span><span className={`class-status ${c.status==="Live Soon"?"live":"upcoming"}`}>{c.status}</span><button className="icon-button danger" title="Delete" onClick={()=>remove(c.id)}><Trash2 size={15}/></button></div>)}</div>
   </section>
  </div>
 </AppLayout>
}
