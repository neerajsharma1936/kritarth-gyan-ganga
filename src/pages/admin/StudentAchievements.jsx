import { useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Edit3, ImagePlus, Plus, Save, Trash2, Trophy, X } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { addStudentAchievement, deleteStudentAchievement, getStudentAchievements, saveStudentAchievements, updateStudentAchievement } from "../../utils/storage";

const EMPTY = { name:"", tag:"", result:"", quote:"", photo:"", order:1, active:true };

function initials(name="Student") { return name.split(/\s+/).filter(Boolean).map(x=>x[0]).slice(0,2).join("").toUpperCase() || "ST"; }

export default function StudentAchievements() {
  const [items,setItems] = useState(() => getStudentAchievements());
  const [editing,setEditing] = useState(null);
  const [message,setMessage] = useState("");
  const [search,setSearch] = useState("");

  const refresh = () => setItems(getStudentAchievements());
  const openNew = () => setEditing({...EMPTY, id:null, order:Math.max(0,...items.map(x=>Number(x.order)||0))+1});
  const openEdit = item => setEditing({...item});

  function save(e) {
    e.preventDefault();
    const clean = {...editing, name:editing.name.trim(), tag:editing.tag.trim(), result:editing.result.trim(), quote:editing.quote.trim(), order:Math.max(1,Number(editing.order)||1), active:!!editing.active};
    if (!clean.name || !clean.result) return;
    if (clean.id) updateStudentAchievement(clean.id, clean); else addStudentAchievement(clean);
    refresh(); setEditing(null); setMessage("Student Achievement saved successfully.");
    setTimeout(()=>setMessage(""),2500);
  }

  function remove(item) {
    if (!window.confirm("Are you sure you want to delete this Student Achievement?")) return;
    deleteStudentAchievement(item.id); refresh(); setMessage("Student Achievement deleted."); setTimeout(()=>setMessage(""),2500);
  }

  function move(item, direction) {
    const sorted=[...items].sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
    const index=sorted.findIndex(x=>x.id===item.id); const target=index+direction;
    if(index<0 || target<0 || target>=sorted.length) return;
    [sorted[index],sorted[target]]=[sorted[target],sorted[index]];
    saveStudentAchievements(sorted.map((x,i)=>({...x,order:i+1}))); refresh();
  }

  const visible = useMemo(() => {
    const q=search.trim().toLowerCase();
    return [...items].sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0)).filter(x=>!q || [x.name,x.tag,x.result,x.quote].some(v=>String(v||"").toLowerCase().includes(q)));
  },[items,search]);

  return <AppLayout title="Student Achievements" subtitle="Create and manage the Student Achievements cards shown on the public website.">
    <div className="achievement-admin-page">
      <div className="page-actions achievement-admin-actions">
        <div><h2 className="page-title">Student Achievements</h2><p className="page-subtitle">All active cards are automatically displayed in the public infinite carousel.</p></div>
        <button className="primary-button" onClick={openNew}><Plus size={16}/> Add Student Achievement</button>
      </div>
      {message && <div className="admin-form-message"><CheckCircle2 size={15}/>{message}</div>}
      <section className="panel">
        <div className="panel-head"><div><h2><Trophy size={18}/> Achievement Cards</h2><p>{items.length} total cards · {items.filter(x=>x.active).length} active</p></div><input className="search-box" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search achievements..." /></div>
        <div className="achievement-admin-grid">
          {visible.map((item)=><article className={`achievement-admin-card ${item.active?"":"is-inactive"}`} key={item.id}>
            <div className="achievement-admin-photo">{item.photo ? <img src={item.photo} alt=""/> : <span>{initials(item.name)}</span>}</div>
            <div className="achievement-admin-body">
              <div className="achievement-admin-top"><span className="achievement-order">#{item.order}</span><span className={`status ${item.active?"paid":"pending"}`}>{item.active?"Active":"Inactive"}</span></div>
              <h3>{item.name}</h3><p className="achievement-admin-tag">{item.tag || "Class / Category not set"}</p><strong>{item.result || "No achievement/result"}</strong><p className="achievement-admin-quote">{item.quote || "No story/testimonial added."}</p>
              <div className="achievement-admin-controls"><button className="icon-button" title="Move up" onClick={()=>move(item,-1)} disabled={(Number(item.order)||1)<=1}><ArrowUp size={15}/></button><button className="icon-button" title="Move down" onClick={()=>move(item,1)} disabled={(Number(item.order)||0)>=items.length}><ArrowDown size={15}/></button><button className="secondary-button" onClick={()=>openEdit(item)}><Edit3 size={14}/> Edit</button><button className="danger-button" onClick={()=>remove(item)}><Trash2 size={14}/> Delete</button></div>
            </div>
          </article>)}
          {!visible.length && <div className="empty-state">No Student Achievement cards found.</div>}
        </div>
      </section>
    </div>
    {editing && <AchievementModal value={editing} onChange={setEditing} onClose={()=>setEditing(null)} onSave={save}/>} 
  </AppLayout>;
}

function AchievementModal({value,onChange,onClose,onSave}) {
  const fileRef=useRef(null);
  const set=(key,val)=>onChange(v=>({...v,[key]:val}));
  function upload(e){const file=e.target.files?.[0]; if(!file) return; if(!file.type.startsWith("image/")) return; const reader=new FileReader(); reader.onload=()=>set("photo",String(reader.result||"")); reader.readAsDataURL(file);}
  return <div className="portal-app modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><div className="modal achievement-modal" role="dialog" aria-modal="true">
    <div className="modal-header"><div><h3>{value.id?"Edit Student Achievement":"Add New Card"}</h3><p className="page-subtitle">Changes are published to the public Student Achievements section after saving.</p></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={17}/></button></div>
    <form className="form-grid achievement-form" onSubmit={onSave}>
      <label>Student Name<input required value={value.name} onChange={e=>set("name",e.target.value)} placeholder="Ananya Kumari"/></label>
      <label>Class / Category<input value={value.tag} onChange={e=>set("tag",e.target.value)} placeholder="Class 10 · BSEB"/></label>
      <label>Achievement / Result<input required value={value.result} onChange={e=>set("result",e.target.value)} placeholder="91% overall"/></label>
      <label>Card Order<input type="number" min="1" value={value.order} onChange={e=>set("order",e.target.value)}/></label>
      <label className="full-span">Testimonial / Student Story<textarea rows="5" value={value.quote} onChange={e=>set("quote",e.target.value)} placeholder="Regular tests made me confident for every paper..."/></label>
      <div className="full-span achievement-upload"><input ref={fileRef} type="file" accept="image/*" onChange={upload} hidden/><div className="achievement-upload-preview">{value.photo?<img src={value.photo} alt="Student preview"/>:<span><ImagePlus size={22}/> No photo</span>}</div><div><strong>Student Photo</strong><p>Upload an image. The public card keeps a consistent photo frame.</p><button type="button" className="secondary-button" onClick={()=>fileRef.current?.click()}><ImagePlus size={15}/> Upload Image</button>{value.photo&&<button type="button" className="text-button" onClick={()=>set("photo","")}>Remove photo</button>}</div></div>
      <label className="achievement-active-toggle full-span"><input type="checkbox" checked={!!value.active} onChange={e=>set("active",e.target.checked)}/> Active — show this card on the public carousel</label>
    </form>
    <div className="modal-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button className="primary-button" type="button" onClick={onSave}><Save size={15}/> Save Card</button></div>
  </div></div>;
}
