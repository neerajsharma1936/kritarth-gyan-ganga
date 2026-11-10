import { useMemo, useState } from "react";
import { CheckCircle2, Edit3, Eye, EyeOff, KeyRound, Plus, Search, ShieldCheck, Trash2, UserCog, UserPlus, X } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { addAdmin, deleteAdmin, getAdmins, getSession, getTeachers, updateAdmin } from "../../utils/storage";

export default function AdminManagement() {
  const session = getSession();
  const storedAdmins = getAdmins();
  const currentAdmin = session ? storedAdmins.find(a =>
    String(a?.id || "") === String(session?.userId || session?.id || "") ||
    String(a?.email || "").trim().toLowerCase() === String(session?.email || "").trim().toLowerCase()
  ) : null;
  const isSuperAdmin = session?.role === "super_admin" || session?.isSuperAdmin === true || currentAdmin?.role === "super_admin" || currentAdmin?.isSuperAdmin === true;
  const [admins, setAdmins] = useState(storedAdmins);
  const [teachers, setTeachers] = useState(getTeachers());
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("new");
  const [editing, setEditing] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ teacherId:"", name:"", email:"", password:"" });
  const [showSuperPasswordForm, setShowSuperPasswordForm] = useState(false);
  const [superPassword, setSuperPassword] = useState("");
  const [showSuperPassword, setShowSuperPassword] = useState(false);
  const [superPasswordMessage, setSuperPasswordMessage] = useState("");

  const availableTeachers = useMemo(() => teachers.filter(t => !admins.some(a => a.teacherId === t.id)), [teachers, admins]);
  const filteredAdmins = useMemo(() => {
    const q = query.trim().toLowerCase();
    return admins.filter(a => !q || [a.name,a.email,a.role,a.source].some(v => String(v||"").toLowerCase().includes(q)));
  }, [admins, query]);

  function refresh(){ setAdmins(getAdmins()); setTeachers(getTeachers()); }
  function openCreate(nextMode="new") {
    if (!isSuperAdmin) return;
    setEditing(null); setMode(nextMode); setShowPassword(false); setMessage("");
    const first = availableTeachers[0];
    setForm({ teacherId:first?.id||"", name:"", email:"", password:"" });
    setShowForm(true);
  }
  function openEdit(admin) {
    if (!isSuperAdmin || admin.role === "super_admin") return;
    setEditing(admin); setMode("edit"); setShowPassword(false); setMessage("");
    setForm({ teacherId:admin.teacherId||"", name:admin.name||"", email:admin.email||"", password:"" });
    setShowForm(true);
  }
  function submit(e){
    e.preventDefault(); setMessage("");
    if(!isSuperAdmin){ setMessage("Only the Super Admin can manage admins."); return; }
    if(mode === "edit"){
      const normalizedEmail=String(form.email||"").trim().toLowerCase();
      if(admins.some(a=>a.id!==editing.id && String(a.email||"").toLowerCase()===normalizedEmail)){ setMessage("That email/login ID is already used by another admin."); return; }
      const patch={name:form.name,email:normalizedEmail};
      if(form.password) patch.password=form.password;
      const updated=updateAdmin(editing.id,patch);
      if(updated){ refresh(); setMessage("Admin details updated successfully."); setForm(f=>({...f,password:""})); }
      return;
    }
    if(mode === "teacher"){
      const teacher=teachers.find(t=>t.id===form.teacherId);
      if(!teacher){setMessage("Please select a teacher.");return;}
      if(!form.password){setMessage("Please create a login password.");return;}
      const email=String(teacher.email||`${teacher.name.toLowerCase().replace(/[^a-z0-9]+/g,".")}@tuitionpro.com`).trim().toLowerCase();
      if(admins.some(a=>String(a.email||"").toLowerCase()===email)){ setMessage("This teacher's email is already assigned to an admin account."); return; }
      const created=addAdmin({name:teacher.name,email,password:form.password,role:"admin",teacherId:teacher.id});
      refresh(); setMessage(`${created.name} has been made an admin.`); setForm(f=>({...f,password:""}));
      return;
    }
    if(!form.name || !form.email || !form.password){setMessage("Please complete all required fields.");return;}
    const normalizedEmail=String(form.email||"").trim().toLowerCase();
    if(admins.some(a=>String(a.email||"").toLowerCase()===normalizedEmail)){ setMessage("That email/login ID is already used by another admin."); return; }
    const created=addAdmin({name:form.name,email:normalizedEmail,password:form.password,role:"admin"});
    refresh(); setMessage(`${created.name} was added successfully.`); setForm(f=>({...f,password:""}));
  }
  function saveSuperAdminPassword(e){
    e.preventDefault();
    if(!isSuperAdmin){ setSuperPasswordMessage("Only the Super Admin can change the Super Admin password."); return; }
    if(String(superPassword).length < 8){ setSuperPasswordMessage("Use at least 8 characters for the Super Admin password."); return; }
    const superAdmin = admins.find(a => a.role === "super_admin");
    if(!superAdmin){ setSuperPasswordMessage("Super Admin account was not found."); return; }
    updateAdmin(superAdmin.id, { password: superPassword });
    refresh();
    setSuperPassword("");
    setShowSuperPassword(false);
    setSuperPasswordMessage("Super Admin password updated successfully.");
  }

  function remove(admin){
    if(!isSuperAdmin || admin.role === "super_admin") return;
    if(window.confirm(`Delete ${admin.name}'s admin access? This will not delete the teacher or other records.`)){
      deleteAdmin(admin.id); refresh();
    }
  }

  return <AppLayout title="Admin Management" subtitle="Manage administrator accounts, permissions and login credentials.">
    <div className="admin-management-page">
      {!isSuperAdmin ? <section className="panel admin-access-denied"><ShieldCheck size={34}/><h2>Super Admin Access Required</h2><p>Only the Super Admin can view and manage administrator records, create admins, promote teachers, edit admin details, or change passwords.</p></section> : <>
      <div className="admin-permission-note"><ShieldCheck size={16}/> Super Admin access is enabled for all administrator records and security controls.</div>
      <section className="admin-overview-grid">
        <div className="admin-overview-card blue"><span>Total Admins</span><strong>{admins.length}</strong><small>All administrator accounts</small></div>
        <div className="admin-overview-card purple"><span>Teacher Admins</span><strong>{admins.filter(a=>a.teacherId).length}</strong><small>Teachers promoted to admin</small></div>
        <div className="admin-overview-card green"><span>Manual Admins</span><strong>{admins.filter(a=>!a.teacherId && a.role!=="super_admin").length}</strong><small>Created as new admins</small></div>
        <div className="admin-overview-card orange"><span>Super Admin</span><strong>{admins.filter(a=>a.role==="super_admin").length}</strong><small>Full control</small></div>
      </section>

      <section className="panel admin-directory-panel">
        <div className="admin-directory-head"><div><h2><UserCog size={19}/> Administrator Accounts</h2><p>All admin details are stored in the existing Kritarth Gyan Ganga admin data store.</p></div><div className="admin-directory-actions"><div className="search-box"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search admin..."/></div>{isSuperAdmin && <><button className="secondary-button" onClick={()=>openCreate("teacher")}><UserPlus size={14}/> Make Teacher Admin</button><button className="primary-button" onClick={()=>openCreate("new")}><Plus size={14}/> New Admin</button></>}</div></div>
        <div className="admin-table-wrap"><table className="admin-directory-table"><thead><tr><th>Admin</th><th>Email / Login ID</th><th>Type</th><th>Source</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead><tbody>
          {filteredAdmins.map(a=><tr key={a.id}>
            <td><div className="admin-table-person"><span className="admin-table-avatar">{(a.name||"A").slice(0,1).toUpperCase()}</span><div><strong>{a.name}</strong><small>{a.id}</small></div></div></td>
            <td><strong>{a.email}</strong><small className="credential-note">Password protected</small></td>
            <td><span className={`role-badge ${a.role}`}>{a.role==="super_admin"?"Super Admin":"Administrator"}</span></td>
            <td>{a.teacherId ? "Teacher → Admin" : a.role==="super_admin" ? "System" : "New Admin"}</td>
            <td>{a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-IN") : "—"}</td>
            <td><span className="admin-active-badge">Active</span></td>
            <td><div className="admin-row-actions"><button title="Edit admin" disabled={a.role==="super_admin" || !isSuperAdmin} onClick={()=>openEdit(a)}><Edit3 size={14}/></button><button title="Delete admin" className="danger" disabled={a.role==="super_admin" || !isSuperAdmin} onClick={()=>remove(a)}><Trash2 size={14}/></button></div></td>
          </tr>)}
          {!filteredAdmins.length && <tr><td colSpan="7"><div className="admin-empty">No administrator accounts found.</div></td></tr>}
        </tbody></table></div>
      </section>

      <section className="panel super-admin-access-panel">
        <div className="panel-head"><div><h2><ShieldCheck size={18}/> Super Admin Access</h2><p>The Super Admin has full access to every administrator record and can create, edit, promote, change passwords, or remove admin access.</p></div></div>
        <div className="super-admin-access-content">
          <div className="super-admin-account-card">
            <div><span>Super Admin Login</span><strong>{admins.find(a=>a.role==="super_admin")?.email || "superadmin@tuitionpro.com"}</strong><small>Full administrator-record access</small></div>
            {isSuperAdmin && <button className="primary-button" type="button" onClick={()=>{setShowSuperPasswordForm(v=>!v);setSuperPasswordMessage("");}}><KeyRound size={14}/> {showSuperPasswordForm ? "Close" : "Create / Change Password"}</button>}
          </div>
          {showSuperPasswordForm && isSuperAdmin && <form className="super-admin-password-form" onSubmit={saveSuperAdminPassword}>
            <label>New Super Admin Password<div className="password-field"><input type={showSuperPassword?"text":"password"} value={superPassword} onChange={e=>setSuperPassword(e.target.value)} placeholder="Create a strong password" minLength={8} required/><button type="button" onClick={()=>setShowSuperPassword(v=>!v)}>{showSuperPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>
            <div className="super-admin-password-actions"><span>Minimum 8 characters. Use this password with the Super Admin login above.</span><button className="primary-button" type="submit">Save Super Admin Password</button></div>
          </form>}
          {superPasswordMessage && <div className="admin-form-message"><CheckCircle2 size={15}/>{superPasswordMessage}</div>}
        </div>
      </section>

      <section className="panel admin-security-panel">
        <div className="panel-head"><div><h2><KeyRound size={18}/> Admin Login & Security</h2><p>Super Admin controls passwords and administrator access from this page.</p></div></div>
        <div className="security-grid"><div><strong>Edit password</strong><span>Select an administrator and use Edit to set a new login password.</span></div><div><strong>Promote a teacher</strong><span>Choose any existing teacher to create an administrator login linked to that teacher.</span></div><div><strong>Delete admin access</strong><span>Deleting an admin removes admin login access but does not delete the linked teacher.</span></div></div>
      </section>
      </>}
    </div>

    {showForm && <div className="admin-modal-backdrop" onMouseDown={()=>setShowForm(false)}><div className="admin-modal admin-management-modal" onMouseDown={e=>e.stopPropagation()}>
      <div className="admin-modal-head"><div><h2>{mode==="edit"?"Edit Admin":mode==="teacher"?"Make Teacher Admin":"Create New Admin"}</h2><p>{mode==="edit"?"Update admin details or change the login password.":mode==="teacher"?"Turn an existing teacher into an administrator.":"Create a separate administrator login."}</p></div><button type="button" onClick={()=>setShowForm(false)}><X size={18}/></button></div>
      {mode!=="edit" && <div className="admin-mode-switch"><button type="button" className={mode==="teacher"?"active":""} onClick={()=>openCreate("teacher")}>Make Teacher Admin</button><button type="button" className={mode==="new"?"active":""} onClick={()=>openCreate("new")}>Create New Admin</button></div>}
      <form className="admin-form" onSubmit={submit}>
        {mode==="teacher" ? <label>Select Teacher<select value={form.teacherId} onChange={e=>setForm({...form,teacherId:e.target.value})} required><option value="">Select Teacher</option>{availableTeachers.map(t=><option key={t.id} value={t.id}>{t.name} — {t.email||"No email"}</option>)}</select></label> : <><label>Admin Name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Enter admin name" required/></label><label>Email / Login ID<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="admin@tuitionpro.com" required/></label></>}
        {mode==="edit" && <div className="linked-admin-info"><UserCog size={15}/><span>{editing?.teacherId ? "Linked to an existing teacher account." : "Independent administrator account."}</span></div>}
        {mode==="edit" && <label>New Password <span className="optional-label">(leave blank to keep current)</span><div className="password-field"><input type={showPassword?"text":"password"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Enter new password" minLength={6}/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>}
        {mode!=="edit" && <label>Password<div className="password-field"><input type={showPassword?"text":"password"} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="Create login password" required minLength={6}/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label>}
        {message && <div className="admin-form-message"><CheckCircle2 size={15}/>{message}</div>}
        <div className="admin-form-actions"><button type="button" className="secondary-button" onClick={()=>setShowForm(false)}>Close</button><button className="primary-button" type="submit">{mode==="edit"?"Save Changes":mode==="teacher"?"Make Admin":"Create Admin"}</button></div>
      </form>
    </div></div>}
  </AppLayout>;
}
