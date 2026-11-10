import { Eye, ReceiptText, Trash2, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { currency, feeStatus, remainingFees } from "../../utils/format";

export default function StudentTable({ students, onReceipt, onDelete }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Roll No.</th>
            <th>Student</th>
            <th>Class</th>
            <th>Total Fees</th>
            <th>Paid</th>
            <th>Remaining</th>
            <th>Status</th>
            <th>Profile / Action</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 ? (
            <tr><td colSpan="8" className="empty">No students found.</td></tr>
          ) : students.map((student) => (
            <tr key={student.id}>
              <td>
                <Link className="roll-link" to={`/admin/students/${student.id}`}>
                  {student.rollNo}
                </Link>
              </td>
              <td>
                <Link className="student-cell student-link" to={`/admin/students/${student.id}`}>
                  <div className="mini-avatar">{student.name.charAt(0)}</div>
                  <div><strong>{student.name}</strong><span>{student.phone}</span></div>
                </Link>
              </td>
              <td>{student.className} - {student.section}</td>
              <td>{currency(student.totalFees)}</td>
              <td className="paid">{currency(student.paidFees)}</td>
              <td className="due">{currency(remainingFees(student))}</td>
              <td><span className={`status ${feeStatus(student).toLowerCase()}`}>{feeStatus(student)}</span></td>
              <td>
                <div className="actions">
                  <Link className="icon-button profile-action" title="Open student profile" to={`/admin/students/${student.id}`}><UserRound size={16} /></Link>
                  <button className="icon-button" title="Receipt" onClick={() => onReceipt(student)}><ReceiptText size={16} /></button>
                  <button className="icon-button danger" title="Delete student" onClick={() => onDelete(student)}><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}