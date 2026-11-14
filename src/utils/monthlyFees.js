export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function academicYearLabel(startYear = new Date().getFullYear()) { return `${startYear}-${String(startYear + 1).slice(-2)}`; }
export function academicYearStartYear(monthKey = "") {
  const [y, m] = String(monthKey || "").split("-").map(Number);
  if (!y || !m) return new Date().getFullYear();
  return m >= 4 ? y : y - 1;
}
export function academicYearMonths(startYear = new Date().getFullYear()) {
  return Array.from({ length: 12 }, (_, i) => {
    const month = ((i + 3) % 12) + 1; // Apr -> Mar
    const year = month >= 4 ? startYear : startYear + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    const d = new Date(year, month - 1, 1);
    return { key, label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }), fullLabel: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) };
  });
}

export function feePlanForMonth(student, month) {
  const history = Array.isArray(student?.feeHistory) ? student.feeHistory : [];
  const sorted = history
    .filter(x => x && x.effectiveFrom)
    .slice()
    .sort((a,b) => String(a.effectiveFrom).localeCompare(String(b.effectiveFrom)));
  let plan = null;
  for (const item of sorted) {
    if (String(item.effectiveFrom).slice(0,7) <= String(month).slice(0,7)) plan = item;
  }
  if (plan) return plan;
  // A month before the student's first fee plan is not part of the student's
  // fee history. Never apply the current class/fee backward to old months.
  if (history.length) return { className: "", monthlyFee: 0, effectiveFrom: "", inactive: true };
  return { className: student?.className || "", monthlyFee: Number(student?.monthlyFee) || Math.round((Number(student?.totalFees) || 0) / 12), effectiveFrom: student?.feeStartMonth || "1900-01" };
}

export function monthlyFeeAmount(student, month = "") {
  if (month) {
    const plan = feePlanForMonth(student, month);
    // A student is not liable for fees before their first fee plan becomes active.
    if (plan.inactive) return 0;
    return Number(plan.monthlyFee) || 0;
  }
  return Number(student?.monthlyFee) || Math.round((Number(student?.totalFees) || 0) / 12);
}

export function getMonthStatus(student, month, payments = []) {
  const amount = monthlyFeeAmount(student, month);
  const paid = payments.filter(p => p.status !== "reversed" && p.studentId === student.id && (p.feeMonth || String(p.date || "").slice(0,7)) === month).reduce((sum,p) => sum + Number(p.amount || 0), 0);
  const plan = feePlanForMonth(student, month);
  const status = plan.inactive && paid === 0 ? "NOT_APPLICABLE" : paid >= amount && amount > 0 ? "PAID" : paid > 0 ? "PARTIAL" : "DUE";
  return { amount, paid, remaining: Math.max(amount - paid, 0), status, plan };
}

export function getStudentTotalPaid(student, payments = [], academicStartYear = null) {
  return payments.filter(p => {
    if (p.status === "reversed" || p.studentId !== student.id) return false;
    if (academicStartYear == null) return true;
    return academicYearStartYear(p.feeMonth || String(p.date || "").slice(0,7)) === Number(academicStartYear);
  }).reduce((sum,p) => sum + Number(p.amount || 0), 0);
}


export function classForMonth(student, month = "") {
  return feePlanForMonth(student, month)?.className || student?.className || "";
}

export function feeHistoryForAcademicYear(student, startYear) {
  const months = academicYearMonths(Number(startYear));
  return months.map(m => ({ ...m, plan: feePlanForMonth(student, m.key) }));
}
