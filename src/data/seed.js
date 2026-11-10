export const seedStudents=[
{id:"STU-1001",rollNo:"TMS-001",name:"Rahul Kumar",fatherName:"Rakesh Kumar",phone:"9876543210",email:"rahul@example.com",aadhaar:"XXXX-XXXX-1234",className:"Class 10",section:"A",monthlyFee:2000,totalFees:24000,paidFees:16000,lastPaymentDate:"2026-08-10",feeStartMonth:"2026-04",admissionDate:"2026-04-01",address:"Greater Noida, Uttar Pradesh",parentName:"Rakesh Kumar",parentWhatsApp:"919876543210",parentPhone:"9876543210",parentEmail:"rakesh@example.com"},
{id:"STU-1002",rollNo:"TMS-002",name:"Priya Sharma",fatherName:"Amit Sharma",phone:"9876501234",email:"priya@example.com",aadhaar:"XXXX-XXXX-5678",className:"Class 9",section:"B",monthlyFee:2000,totalFees:24000,paidFees:22000,lastPaymentDate:"2026-07-28",feeStartMonth:"2026-04",admissionDate:"2026-04-03",address:"Noida, Uttar Pradesh",parentName:"Amit Sharma",parentWhatsApp:"919876500000",parentPhone:"9876501234",parentEmail:"amit@example.com"},
{id:"STU-1003",rollNo:"TMS-003",name:"Aman Singh",fatherName:"Vijay Singh",phone:"9811122233",email:"aman@example.com",aadhaar:"XXXX-XXXX-9012",className:"Class 12",section:"A",monthlyFee:2500,totalFees:30000,paidFees:12000,lastPaymentDate:"2026-07-15",feeStartMonth:"2026-04",admissionDate:"2026-04-05",address:"Delhi",parentName:"Vijay Singh",parentWhatsApp:"919811122233",parentPhone:"9811122233",parentEmail:"vijay@example.com"}
];
export const seedPayments=[
{id:"PAY-001",studentId:"STU-1001",amount:8000,date:"2026-08-10",mode:"UPI",note:"August fee",feeMonth:"2026-08",reference:""},
{id:"PAY-002",studentId:"STU-1001",amount:8000,date:"2026-06-10",mode:"Cash",note:"June fee",feeMonth:"2026-06",reference:""},
{id:"PAY-003",studentId:"STU-1002",amount:10000,date:"2026-07-28",mode:"UPI",note:"July fee",feeMonth:"2026-07",reference:""},
{id:"PAY-004",studentId:"STU-1002",amount:12000,date:"2026-05-20",mode:"Cash",note:"May fee",feeMonth:"2026-05",reference:""},
{id:"PAY-005",studentId:"STU-1003",amount:12000,date:"2026-07-15",mode:"UPI",note:"July fee",feeMonth:"2026-07",reference:""}
];
