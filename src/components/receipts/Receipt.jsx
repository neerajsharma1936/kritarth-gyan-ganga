import { currency, dateFormat } from "../../utils/format";
import { getMonthStatus } from "../../utils/monthlyFees";
import { getWebsiteContent } from "../../utils/storage";
import logo from "../../assets/kritarth-gyan-ganga-logo.png";
import receiptSignature from "../../assets/receipt-signature.png";
import receiptStamp from "../../assets/receipt-stamp.png";
import receiptUpi from "../../assets/receipt-upi.png";
import { CheckCircle2, UserRound, MapPin, Phone, GraduationCap, CreditCard, ClipboardList } from "lucide-react";

function monthLabel(value = "") {
  if (!value) return "-";
  const [year, month] = String(value).split("-");
  if (!year || !month) return value;
  const date = new Date(Number(year), Number(month) - 1, 1);
  return `${value} (${date.toLocaleString("en-IN", { month: "long", year: "numeric" })})`;
}

function paymentDateTime(payment) {
  if (!payment?.date && !payment?.createdAt) return "-";
  const raw = payment?.createdAt || payment?.date;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return dateFormat(payment?.date);
  return `${date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })} ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

function amountValue(value) {
  return currency(Number(value || 0)).replace(/^₹\s?/, "");
}

export default function Receipt({ student = {}, payment = {}, payments = [], exportMode = false }) {
  const feeMonth = payment?.feeMonth || String(payment?.date || "").slice(0, 7);
  const summary = feeMonth
    ? getMonthStatus(student, feeMonth, payments)
    : { amount: Number(student.monthlyFee || 0), paid: Number(payment?.amount || 0), remaining: 0 };

  const website = getWebsiteContent() || {};
  const parent = student.parentName || student.fatherName || "-";
  const status = payment?.status === "reversed"
    ? "REVERSED"
    : summary.paid >= summary.amount && summary.amount > 0
      ? "PAID"
      : summary.paid > 0
        ? "PARTIAL"
        : "DUE";

  const paymentMode = String(payment?.mode || "-").toUpperCase();
  const reference = payment?.reference || payment?.utr || "-";
  const paymentStatus = payment?.status === "reversed" ? "Reversed" : "Successful";
  const address = website.address || "Hiramiya Ward No - 04, Rosera (Samastipur, Bihar) - 848210";
  const phone = website.phone || "+91 7091889682";
  const directorName = website.directorName || "Saroj Kumar";

  return (
    <div className={`receipt ${exportMode ? "receipt-export" : ""}`} id={exportMode ? "receipt-export" : "print-receipt"}>
      <div className="receipt-page">
        <header className="receipt-header">
          <div className="receipt-brand">
            <img src={logo} alt="Kritarth Gyan Ganga logo" />
            <div className="receipt-brand-text">
              <h1>Kritarth Gyan Ganga</h1>
              <div className="receipt-tagline">Better Education <span>|</span> Brighter Future</div>
            </div>
          </div>
          <div className="receipt-number">
            <strong>FEE RECEIPT</strong>
            <span># {payment?.id || "RECEIPT"}</span>
          </div>
        </header>

        <div className="receipt-header-rule" />

        <div className="receipt-contact-bar">
          <div><MapPin /><span>{address}</span></div>
          <div><Phone /><span>{phone}</span></div>
          <div><GraduationCap /><span>Coaching for a Better Tomorrow</span></div>
        </div>

        <section className="receipt-box student-box">
          <div className="receipt-box-heading light-blue">
            <UserRound />
            <strong>Student Details</strong>
          </div>
          <div className="student-box-body">
            <div className="student-fields">
              <ReceiptField label="Student Name" value={student.name || "-"} />
              <ReceiptField label="Roll Number" value={student.rollNo || "-"} />
              <ReceiptField label="Class" value={student.className ? `${student.className}${student.section ? ` - ${student.section}` : ""}` : "-"} />
              <ReceiptField label="Parent / Guardian" value={parent} />
              <ReceiptField label="Fee Month" value={monthLabel(feeMonth)} />
              <ReceiptField label="Payment Date" value={dateFormat(payment?.date)} />
            </div>

            <div className={`receipt-status ${status.toLowerCase()}`}>
              <div className="status-badge">
                <CheckCircle2 />
                <strong>{status}</strong>
              </div>
              <div className="thank-you">Thank You<br />for Your Payment!</div>
            </div>
          </div>
        </section>

        <section className="receipt-box fee-box">
          <div className="receipt-box-heading navy">
            <span className="rupee-icon">₹</span>
            <strong>Fee Details</strong>
          </div>
          <div className="fee-table">
            <div className="fee-row fee-head">
              <span>S.No.</span><span>Particulars</span><span>Amount (₹)</span>
            </div>
            <FeeRow no="1" label="Monthly Fee" value={amountValue(summary.amount)} />
            <FeeRow no="2" label="Amount Paid This Transaction" value={amountValue(payment?.amount)} />
            <FeeRow no="3" label="Total Paid For Month" value={amountValue(summary.paid)} />
            <FeeRow no="4" label="Remaining For Month" value={amountValue(summary.remaining)} />
            <div className="fee-row total-due">
              <span></span>
              <strong>Total Due (Remaining)</strong>
              <strong>{amountValue(summary.remaining)}</strong>
            </div>
          </div>
        </section>

        <section className="receipt-box payment-box">
          <div className="receipt-box-heading green">
            <CreditCard />
            <strong>Online Payment Details</strong>
          </div>
          <div className="payment-box-body">
            <div className="payment-fields">
              <ReceiptField label="Payment Mode" value={paymentMode} />
              <ReceiptField label={paymentMode === "UPI" ? "UPI Transaction ID (UTR)" : "Transaction / Reference"} value={reference} />
              <ReceiptField label="Payment Date & Time" value={paymentDateTime(payment)} />
              <ReceiptField label="Payment Status" value={paymentStatus} valueClass={payment?.status === "reversed" ? "reversed" : "successful"} />
            </div>
            <div className="upi-panel">
              {paymentMode === "UPI" ? (
                <img src={receiptUpi} alt="UPI payment" />
              ) : (
                <>
                  <div className="upi-mode-text">{paymentMode}</div>
                  <span className={payment?.status === "reversed" ? "reversed" : ""}>
                    {payment?.status === "reversed" ? "REVERSED" : "PAID"}
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        <div className="receipt-bottom">
          <div className="terms">
            <h3><ClipboardList /> Note / Terms &amp; Conditions</h3>
            <ul>
              <li>Fee once paid is non-refundable.</li>
              <li>This receipt is valid for the above mentioned payment only.</li>
              <li>For any query, contact the institute office or WhatsApp.</li>
              <li>Keep this receipt for your records.</li>
            </ul>
          </div>

          <div className="signature-area">
            <img className="receipt-signature" src={receiptSignature} alt="Authorized Signature" />
            <strong className="receipt-director-name">{directorName} (Director)</strong>
            <img className="receipt-stamp" src={receiptStamp} alt="Kritarth Gyan Ganga stamp" />
          </div>
        </div>

        <footer className="receipt-footer">
          <strong>Kritarth Gyan Ganga Rosera</strong>
          <span>Learn&nbsp;&nbsp;•&nbsp;&nbsp;Practice&nbsp;&nbsp;•&nbsp;&nbsp;Succeed</span>
        </footer>
      </div>
    </div>
  );
}

function ReceiptField({ label, value, valueClass = "" }) {
  return (
    <div className="receipt-field">
      <span>{label}</span>
      <b>:</b>
      <strong className={valueClass}>{value}</strong>
    </div>
  );
}

function FeeRow({ no, label, value }) {
  return (
    <div className="fee-row">
      <span>{no}</span>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
