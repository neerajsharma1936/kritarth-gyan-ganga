export function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

export function dateFormat(value) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function remainingFees(student) {
  return Math.max(Number(student.totalFees) - Number(student.paidFees), 0);
}

export function feeStatus(student) {
  const remaining = remainingFees(student);
  if (remaining === 0) return "Paid";
  if (Number(student.paidFees) > 0) return "Partial";
  return "Pending";
}