import { seedStudents, seedPayments } from "../data/seed";
const STUDENTS="tms_students", PAYMENTS="tms_payments", SESSION="tms_session", PAYMENT_METHODS="tms_payment_methods", WEBSITE_CONTENT="tms_website_content";
const TEACHERS="tms_teachers", TEACHER_SALARY_PAYMENTS="tms_teacher_salary_payments", ADMIN="brightpath_admin", ADMINS="tms_admins", DEMO_REQUESTS="tms_demo_requests";
function read(key,fallback){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{return fallback}}
export function normalizeClassName(value="") {
  const v=String(value||"").trim().toLowerCase();
  if(v==="nursery"||v==="nursary") return "Nursery";
  if(v==="lkg") return "LKG";
  if(v==="ukg") return "UKG";
  const match=v.match(/(?:class\s*)?(\d+)(?:th|st|nd|rd)?/);
  return match ? `Class ${Number(match[1])}` : String(value||"").trim();
}
export function getStudents(){return read(STUDENTS,seedStudents).map(s=>{
  const baseMonthlyFee=Number(s.monthlyFee)||Math.round((Number(s.totalFees)||0)/12);
  const baseClass=normalizeClassName(s.className);
  const history=Array.isArray(s.feeHistory)&&s.feeHistory.length
    ? s.feeHistory.map(x=>({...x,className:normalizeClassName(x.className||baseClass),monthlyFee:Number(x.monthlyFee)||baseMonthlyFee,effectiveFrom:String(x.effectiveFrom||s.feeStartMonth||new Date().toISOString().slice(0,7)).slice(0,7)}))
    : [{className:baseClass,monthlyFee:baseMonthlyFee,effectiveFrom:String(s.feeStartMonth||new Date().toISOString().slice(0,7)).slice(0,7)}];
  const currentMonth=new Date().toISOString().slice(0,7);
  const currentPlan=history.filter(x=>String(x.effectiveFrom)<=currentMonth).sort((a,b)=>String(a.effectiveFrom).localeCompare(String(b.effectiveFrom))).slice(-1)[0] || history[0];
  return {...s,className:currentPlan.className,monthlyFee:currentPlan.monthlyFee,parentName:s.parentName||s.fatherName||"",parentWhatsApp:s.parentWhatsApp||s.phone||"",parentPhone:s.parentPhone||s.phone||"",parentEmail:s.parentEmail||s.email||"",archived:s.archived===true,feeHistory:history};
})}
export function saveStudents(students){localStorage.setItem(STUDENTS,JSON.stringify(students))}
export function getPayments(){
  return read(PAYMENTS,seedPayments).map(p => ({
    ...p,
    feeMonth: p.feeMonth || String(p.date || "").slice(0,7),
    reference: p.reference || "",
    collectedByUserId: p.collectedByUserId || "",
    collectedByName: p.collectedByName || "",
    collectedByRole: p.collectedByRole || ""
  }));
}
export function savePayments(payments){localStorage.setItem(PAYMENTS,JSON.stringify(payments))}
const defaultPaymentMethods=[
 {id:"upi",name:"UPI",type:"upi",upiId:"tuitionpro@upi",qrCode:"",enabled:true},
 {id:"cash",name:"Cash",type:"cash",instructions:"Pay directly at the tuition center.",enabled:true},
 {id:"bank",name:"Bank Transfer",type:"bank",accountName:"Kritarth Gyan Ganga",accountNumber:"0000000000",ifsc:"BANK0000000",enabled:false}
];
export function getPaymentMethods(){return read(PAYMENT_METHODS,defaultPaymentMethods)}
export function savePaymentMethods(methods){localStorage.setItem(PAYMENT_METHODS,JSON.stringify(methods))}

const defaultDemoRequests=[
 {id:"DEMO-001",name:"Aarav Sharma",parent:"Rahul Sharma",className:"Class 8",subject:"Mathematics",phone:"9800000021",email:"parent@example.com",preferredDate:"2026-09-04",preferredTime:"17:00",mode:"Online",status:"New",notes:"Interested in a trial Mathematics class."},
 {id:"DEMO-002",name:"Ananya Verma",parent:"Priya Verma",className:"Class 10",subject:"Science",phone:"9700000045",email:"priya@example.com",preferredDate:"2026-09-07",preferredTime:"16:00",mode:"Offline",status:"Contacted",notes:"Parent requested an evening slot."},
 {id:"DEMO-003",name:"Rohan Gupta",parent:"Amit Gupta",className:"Class 12",subject:"Physics",phone:"9900000087",email:"amit@example.com",preferredDate:"2026-09-06",preferredTime:"18:00",mode:"Online",status:"Scheduled",notes:"Demo confirmed."},
 {id:"DEMO-004",name:"Ishita Singh",parent:"Vikram Singh",className:"Class 9",subject:"English",phone:"9600000033",email:"vikram@example.com",preferredDate:"2026-09-05",preferredTime:"17:30",mode:"Online",status:"New",notes:""},
 {id:"DEMO-005",name:"Vihaan Mehta",parent:"Suresh Mehta",className:"Class 7",subject:"Mathematics",phone:"9500000012",email:"suresh@example.com",preferredDate:"2026-09-05",preferredTime:"16:00",mode:"Offline",status:"Contacted",notes:"Follow up tomorrow."}
];
export function getDemoRequests(){return read(DEMO_REQUESTS,defaultDemoRequests)}
export function saveDemoRequests(requests){localStorage.setItem(DEMO_REQUESTS,JSON.stringify(requests))}
export function addDemoRequest(request){const created={...request,id:`DEMO-${Date.now()}`,status:request.status||"New",createdAt:new Date().toISOString()};saveDemoRequests([...getDemoRequests(),created]);return created}
export function updateDemoRequest(id,patch){const updated=getDemoRequests().map(r=>r.id===id?{...r,...patch,updatedAt:new Date().toISOString()}:r);saveDemoRequests(updated);return updated.find(r=>r.id===id)}


const defaultWebsiteContent={
 phone:"+91 7091889682", email:"kritarthgyanganga@gmail.com", address:"Hiramiya Ward No - 04, Rosera (Samastipur, Bihar) - 848210", directorName:"Saroj Kumar",
 linkedin:"https://www.linkedin.com/in/kritarth-gyan-ganga-740b08432", instagram:"https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=f28hyvd", facebook:"https://www.facebook.com/share/19CZ3QdMcH/", twitter:"https://x.com/kritarthGywsb2", youtube:"https://www.youtube.com/@KritarthGyanGanga",
 heroEyebrow:"For Bihar's young learners", heroHeading:"Strong foundations. Brighter futures.",
 heroDescription:"Personal tuition for Nursery to Class 12. We support Bihar Board, CBSE and ICSE students with small batches, caring teachers and clear learning goals.",
 heroImage:"", approachImage:"", nextClass:"Class 10 Maths · Today, 5:30 PM",
 stories:[
  {id:"STORY-1",name:"Ananya Kumari",tag:"Class 10 · BSEB",result:"Board result · 91% overall",quote:"Regular tests made me confident for every paper. Maths became my strongest subject.",photo:""},
  {id:"STORY-2",name:"Rohit Kumar",tag:"Class 12 · Science",result:"PCM result · 89% overall",quote:"My teachers helped me follow a daily plan and clear every difficult Physics topic.",photo:""},
  {id:"STORY-3",name:"Priya Singh",tag:"Class 5 · CBSE",result:"School merit · All-round growth",quote:"Now I finish my homework on time and enjoy reading English stories aloud.",photo:""}
 ]
};
export function getWebsiteContent(){
 const saved=read(WEBSITE_CONTENT,null);
 if(!saved) return defaultWebsiteContent;
 const migrated={...saved};
 const legacyMap={phone:["+91 98765 43210"],email:["admissions@brightpathbihar.in"],address:["Patna, Bihar"]};
 Object.entries(legacyMap).forEach(([key,legacyValues])=>{if(legacyValues.includes(migrated[key])) migrated[key]=defaultWebsiteContent[key];});
 return {...defaultWebsiteContent,...migrated,stories:Array.isArray(migrated.stories)&&migrated.stories.length?migrated.stories:defaultWebsiteContent.stories};
}
export function saveWebsiteContent(content){localStorage.setItem(WEBSITE_CONTENT,JSON.stringify(content));return content}

// Student Achievements are intentionally stored separately from Website Content so the
// admin gets a dedicated management area without changing other website settings.
const STUDENT_ACHIEVEMENTS="tms_student_achievements";
function defaultStudentAchievements(){
  const stories=getWebsiteContent().stories || [];
  return stories.map((s,i)=>({id:s.id || `ACH-${i+1}`,name:s.name||"Student",tag:s.tag||"",result:s.result||"",quote:s.quote||"",photo:s.photo||"",order:i+1,active:true}));
}
export function getStudentAchievements(){
  const saved=read(STUDENT_ACHIEVEMENTS,null);
  if(Array.isArray(saved)) return saved.map((x,i)=>({...x,order:Number(x.order)||i+1,active:x.active!==false}));
  const seeded=defaultStudentAchievements();
  try{localStorage.setItem(STUDENT_ACHIEVEMENTS,JSON.stringify(seeded))}catch{}
  return seeded;
}
export function saveStudentAchievements(items){const normalized=(Array.isArray(items)?items:[]).map((x,i)=>({...x,order:Number(x.order)||i+1,active:x.active!==false}));localStorage.setItem(STUDENT_ACHIEVEMENTS,JSON.stringify(normalized));return normalized}
export function addStudentAchievement(item){const created={...item,id:item.id||`ACH-${Date.now()}`,order:Number(item.order)||getStudentAchievements().length+1,active:item.active!==false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};saveStudentAchievements([...getStudentAchievements(),created]);return created}
export function updateStudentAchievement(id,patch){const updated=getStudentAchievements().map(x=>x.id===id?{...x,...patch,updatedAt:new Date().toISOString()}:x);saveStudentAchievements(updated);return updated.find(x=>x.id===id)||null}
export function deleteStudentAchievement(id){const updated=getStudentAchievements().filter(x=>x.id!==id);saveStudentAchievements(updated);return updated}

const OFFERS="tms_offers";
const CLASS_SCHEDULE="tms_class_schedule";
const defaultOffer={id:"OFFER-001",discount:"20% OFF",title:"New Admission Offer",description:"Get 20% OFF on your first month's tuition fee.",expiry:"Ends in 5 Days",live:true};
const defaultClassSchedule=[{id:"CLS-001",time:"04:00 PM",name:"Class 8 Mathematics",teacher:"Rahul Sir",room:"Room 2",status:"Live Soon",tone:"blue"},{id:"CLS-002",time:"05:00 PM",name:"Class 10 Science",teacher:"Priya Ma'am",room:"Room 1",status:"Upcoming",tone:"purple"},{id:"CLS-003",time:"06:30 PM",name:"Class 12 Physics",teacher:"Amit Sir",room:"Online",status:"Upcoming",tone:"orange"}];
export function getOffer(){return read(OFFERS,defaultOffer)}
export function saveOffer(offer){localStorage.setItem(OFFERS,JSON.stringify(offer));return offer}
export function getClassSchedule(){return read(CLASS_SCHEDULE,defaultClassSchedule)}
export function saveClassSchedule(rows){localStorage.setItem(CLASS_SCHEDULE,JSON.stringify(rows));return rows}
export function addClassSchedule(row){const created={...row,id:`CLS-${Date.now()}`};saveClassSchedule([...getClassSchedule(),created]);return created}
export function getSession(){return read(SESSION,null)}
export function setSession(session){localStorage.setItem(SESSION,JSON.stringify(session))}
export function clearSession(){
  // Clear authentication state only; keep application records intact.
  localStorage.removeItem(SESSION);
  try {
    // Remove any auth/session artifacts that may have been left by earlier versions.
    ["tms_auth", "auth_session", "tuitionpro_session", "brightpath_session", "access_token", "auth_token", "token"].forEach((key) => sessionStorage.removeItem(key));
    sessionStorage.removeItem(SESSION);
  } catch {}
}
export function deleteStudent(studentId){return archiveStudent(studentId)}

// Permanently removes a student and all payment records belonging to that student.
// Use only after an explicit confirmation because this cannot be undone.
export function permanentlyDeleteStudent(studentId){
  const students=getStudents();
  const exists=students.some(s=>s.id===studentId);
  if(!exists) return false;
  saveStudents(students.filter(s=>s.id!==studentId));
  savePayments(getPayments().filter(p=>p.studentId!==studentId));
  return true;
}

export function archiveStudent(studentId){const updated=getStudents().map(s=>s.id===studentId?{...s,archived:true,archivedAt:new Date().toISOString()}:s);saveStudents(updated);return updated.find(s=>s.id===studentId)||null}
export function restoreStudent(studentId){const updated=getStudents().map(s=>s.id===studentId?{...s,archived:false,archivedAt:""}:s);saveStudents(updated);return updated.find(s=>s.id===studentId)||null}
export function getAdmins(){
  const existing = read(ADMINS, null);
  let admins = Array.isArray(existing) ? existing : [];
  const legacy = read(ADMIN, null);
  if (!admins.length) {
    const legacyAdmin = legacy && legacy.email ? legacy : null;
    const seed = {
      id: legacyAdmin?.id || "ADM-1001", name: legacyAdmin?.name || "Super Admin",
      email: String(legacyAdmin?.email || "superadmin@tuitionpro.com").trim().toLowerCase(),
      password: legacyAdmin?.password || "SuperAdmin@123", role:"super_admin", isSuperAdmin:true,
      source:"system", createdAt:legacyAdmin?.createdAt || new Date().toISOString(), updatedAt:new Date().toISOString()
    };
    admins=[seed];
  } else {
    admins=admins.map(a=>({...a,email:String(a?.email||"").trim().toLowerCase(),isSuperAdmin:a.role==="super_admin" || a.isSuperAdmin===true}));
    if (!admins.some(a=>a.role==="super_admin" || a.isSuperAdmin===true)) {
      admins=[{id:"ADM-1001",name:"Super Admin",email:"superadmin@tuitionpro.com",password:"SuperAdmin@123",role:"super_admin",isSuperAdmin:true,source:"system",createdAt:new Date().toISOString()},...admins];
    }
  }
  try { localStorage.setItem(ADMINS, JSON.stringify(admins)); } catch {}
  return admins;
}
export function saveAdmins(admins){localStorage.setItem(ADMINS,JSON.stringify(admins));localStorage.setItem(ADMIN,JSON.stringify(admins.find(a=>a.role==="super_admin")||admins[0]||null))}
export function addAdmin({name,email,password,role="admin",teacherId=""}){
  const admins=getAdmins();
  const normalized=String(email||"").trim().toLowerCase();
  if(admins.some(a=>String(a.email||"").toLowerCase()===normalized)) return admins.find(a=>String(a.email||"").toLowerCase()===normalized);
  const created={id:`ADM-${Date.now()}`,name:String(name||"").trim(),email:normalized,password,role,isSuperAdmin:role==="super_admin",teacherId:teacherId||"",source:teacherId?"teacher":"manual",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  saveAdmins([...admins,created]);
  if(teacherId){
    saveTeachers(getTeachers().map(t=>t.id===teacherId?{...t,isAdmin:true,adminId:created.id}:t));
  }
  return created;
}
export function updateAdmin(id,patch){
  const admins=getAdmins();
  const current=admins.find(a=>a.id===id);
  if(!current) return null;
  const next={...current,...patch,updatedAt:new Date().toISOString()};
  if(patch.email) next.email=String(patch.email).trim().toLowerCase();
  if(patch.role) next.isSuperAdmin=patch.role==="super_admin";
  saveAdmins(admins.map(a=>a.id===id?next:a));
  return next;
}
export function deleteAdmin(id){
  const admins=getAdmins();
  const target=admins.find(a=>a.id===id);
  if(!target || target.role==="super_admin") return false;
  saveAdmins(admins.filter(a=>a.id!==id));
  if(target.teacherId){
    saveTeachers(getTeachers().map(t=>t.id===target.teacherId?{...t,isAdmin:false,adminId:""}:t));
  }
  return true;
}
export function authenticateAdmin(email,password){
  const normalized=String(email||"").trim().toLowerCase();
  const supplied=String(password||"");
  return getAdmins().find(a => String(a?.email||"").trim().toLowerCase()===normalized && String(a?.password||"")===supplied) || null;
}
function nextRoll(students){const nums=students.map(s=>Number(String(s.rollNo||"").replace(/\D/g,""))||0);return `TMS-${String(Math.max(0,...nums)+1).padStart(3,"0")}`}
export function addStudent(student){const students=getStudents();const monthlyFee=Number(student.monthlyFee||0);const feeStartMonth=student.feeStartMonth||new Date().toISOString().slice(0,7);const className=normalizeClassName(student.className);const newStudent={...student,id:`STU-${Date.now()}`,rollNo:nextRoll(students),className,monthlyFee,totalFees:monthlyFee*12,paidFees:0,lastPaymentDate:"",feeStartMonth,feeHistory:[{className,monthlyFee,effectiveFrom:feeStartMonth}],photo:student.photo||""};saveStudents([...students,newStudent]);return newStudent}
export function updateStudent(id,patch){
  const { feeEffectiveFrom, ...safePatch } = patch || {};
  const updated=getStudents().map(s=>{
    if(s.id!==id) return s;
    const next={...s,...safePatch,className:safePatch.className?normalizeClassName(safePatch.className):s.className};
    const classChanged=next.className!==s.className;
    const feeChanged=Number(next.monthlyFee||0)!==Number(s.monthlyFee||0);
    if(classChanged||feeChanged){
      const effectiveFrom=String(feeEffectiveFrom||safePatch.feeStartMonth||new Date().toISOString().slice(0,7)).slice(0,7);
      const history=Array.isArray(s.feeHistory)?s.feeHistory.slice():[];
      const withoutSame=history.filter(x=>String(x.effectiveFrom||"").slice(0,7)!==effectiveFrom);
      next.feeHistory=[...withoutSame,{className:next.className,monthlyFee:Number(next.monthlyFee)||0,effectiveFrom}].sort((a,b)=>String(a.effectiveFrom).localeCompare(String(b.effectiveFrom)));
      next.feeStartMonth=effectiveFrom;
      next.totalFees=Number(next.monthlyFee||0)*12;
    }
    return next;
  });
  saveStudents(updated);return updated.find(s=>s.id===id)
}

// Promote a student without creating a new student record. The old class/fee plan
// remains in feeHistory and every old payment remains attached to the same student.
// The new plan becomes active from the selected academic month.
export function promoteStudent(id, { className, monthlyFee, effectiveFrom }) {
  const student=getStudents().find(s=>s.id===id);
  if(!student) return null;
  const nextClass=normalizeClassName(className);
  const nextFee=Number(monthlyFee||0);
  const month=String(effectiveFrom||new Date().toISOString().slice(0,7)).slice(0,7);
  if(!nextClass || nextFee<=0 || !/^\d{4}-\d{2}$/.test(month)) return null;
  return updateStudent(id,{ className:nextClass, monthlyFee:nextFee, feeStartMonth:month, feeEffectiveFrom:month });
}
export function reversePayment(paymentId, reason="Payment reversed") {
  const payments=getPayments(); const target=payments.find(p=>p.id===paymentId); if(!target || target.status==="reversed") return false;
  const session=getSession();
  const updated=payments.map(p=>p.id===paymentId?{...p,status:"reversed",reversedAt:new Date().toISOString(),reversedReason:reason,reversedByUserId:session?.userId||"",reversedByName:session?.name||""}:p);
  savePayments(updated);
  const students=getStudents();
  const active=updated.filter(p=>p.studentId===target.studentId && p.status!=="reversed");
  const totalPaid=active.reduce((sum,p)=>sum+Number(p.amount||0),0);
  const last=active.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
  saveStudents(students.map(s=>s.id===target.studentId?{...s,paidFees:totalPaid,lastPaymentDate:last?.date||""}:s));
  return true;
}
export function addPayment(payment){
  const payments=getPayments();
  const session=getSession();
  const year=String(payment.date||new Date().toISOString()).slice(0,4);
  const count=payments.filter(p=>String(p.id||"").startsWith(`FEE-${year}-`)).length+1;

  // Stamp the payment at write-time with the authenticated collector.
  // This makes the audit trail independent of whoever is viewing the Fees page later.
  const collector = {
    collectedByUserId: payment.collectedByUserId || session?.userId || session?.id || session?.email || "",
    collectedByName: payment.collectedByName || session?.name || "Unknown user",
    collectedByRole: payment.collectedByRole || session?.role || "admin"
  };
  const created={
    ...payment,
    ...collector,
    id:`FEE-${year}-${String(count).padStart(4,"0")}`,
    amount:Number(payment.amount||0),
    createdAt:new Date().toISOString()
  };
  savePayments([...payments,created]);
  const students=getStudents();
  const student=students.find(s=>s.id===payment.studentId);
  const studentPayments=[...payments,created].filter(p=>p.status !== "reversed" && p.studentId===payment.studentId);
  const totalPaid=studentPayments.reduce((sum,p)=>sum+Number(p.amount||0),0);
  saveStudents(students.map(s=>s.id===payment.studentId?{...s,paidFees:totalPaid,lastPaymentDate:payment.date}:s));
  return created;
}
export function getTeachers(){return read(TEACHERS,seedTeachers)}
export function saveTeachers(teachers){localStorage.setItem(TEACHERS,JSON.stringify(teachers))}
const seedTeachers=[{id:"TCH-1001",teacherId:"TCH-001",name:"Rahul Kumar",photo:"",gender:"Male",dateOfBirth:"1992-06-12",address:"Delhi",qualification:"M.Sc. Mathematics",subjects:["Mathematics"],classes:["9th","10th","12th"],experience:8,joiningDate:"2025-04-01",employmentStatus:"Active",whatsapp:"919871234567",phone:"9871234567",email:"rahul.teacher@example.com",emergencyContact:"9870000000",monthlySalary:25000,salaryPaymentDate:5,salaryStatus:"Paid",salaryNotes:""},{id:"TCH-1002",teacherId:"TCH-002",name:"Priya Sharma",photo:"",gender:"Female",dateOfBirth:"1994-09-21",address:"Noida",qualification:"M.A. English",subjects:["English"],classes:["8th","9th","10th"],experience:6,joiningDate:"2025-06-10",employmentStatus:"Active",whatsapp:"919876543210",phone:"9876543210",email:"priya.teacher@example.com",emergencyContact:"9871111111",monthlySalary:22000,salaryPaymentDate:5,salaryStatus:"Pending",salaryNotes:""}];
export function addTeacher(teacher){const teachers=getTeachers();const nums=teachers.map(t=>Number(String(t.teacherId||"").replace(/\D/g,""))||0);const teacherId=`TCH-${String(Math.max(0,...nums)+1).padStart(3,"0")}`;const created={...teacher,id:`TCH-${Date.now()}`,teacherId};saveTeachers([...teachers,created]);return created}
export function getTeacherSalaryPayments(){return read(TEACHER_SALARY_PAYMENTS,[])}
export function saveTeacherSalaryPayments(payments){localStorage.setItem(TEACHER_SALARY_PAYMENTS,JSON.stringify(payments))}
export function addTeacherSalaryPayment(payment){const created={...payment,id:`SAL-${Date.now()}`};saveTeacherSalaryPayments([...getTeacherSalaryPayments(),created]);return created}
