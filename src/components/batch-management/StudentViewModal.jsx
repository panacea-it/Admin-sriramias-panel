import { Mail, Phone, Hash, CreditCard, BarChart3, CalendarCheck, Loader2 } from 'lucide-react'
import BatchFormModalShell from './BatchFormModalShell'
import PaymentStatusBadge from './PaymentStatusBadge'
import ProgressBar from './ProgressBar'
import StudentEnrollmentStatusBadge from './StudentEnrollmentStatusBadge'

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50/80 px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#246392] shadow-sm">
        <Icon className="h-4 w-4" strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca0a8]">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-[#111]">{value}</p>
      </div>
    </div>
  )
}

function ViewLoadingBody() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-[#55ace7]" />
      <p className="mt-4 text-sm font-medium text-[#686868]">Loading enrollment details…</p>
    </div>
  )
}

export default function StudentViewModal({ open, onClose, student, batch, loading = false }) {
  if (!open) return null

  const showLoading = loading || !student
  const initials = student?.name
    ? student.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '—'

  return (
    <BatchFormModalShell
      open={open}
      onClose={onClose}
      title={student?.name ?? 'Student Details'}
      subtitle={batch?.displayName ?? '—'}
      size="md"
      saving={loading}
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-xl bg-gradient-to-r from-[#55ace7] to-[#246392] px-8 text-sm font-bold text-white shadow-[0_4px_12px_rgba(85,172,231,0.4)] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>
      }
    >
      {showLoading ? (
        <ViewLoadingBody />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#cbeeff] text-sm font-bold text-[#246392]">
              {initials}
            </span>
            <PaymentStatusBadge status={student.paymentStatus} />
            <StudentEnrollmentStatusBadge status={student.status} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow icon={Mail} label="Email" value={student.email} />
            <DetailRow icon={Phone} label="Phone" value={student.phone} />
            <DetailRow icon={Hash} label="Enrollment ID" value={student.enrollmentId} />
            <DetailRow icon={CreditCard} label="Payment" value={student.paymentStatus} />
            <div className="sm:col-span-2">
              <DetailRow icon={CalendarCheck} label="Attendance" value={`${student.attendance}%`} />
              <div className="mt-2 px-1">
                <ProgressBar value={student.attendance} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#9ca0a8]">
                <BarChart3 className="h-3.5 w-3.5" />
                Course Progress
              </p>
              <ProgressBar value={student.progress} />
            </div>
          </div>
        </>
      )}
    </BatchFormModalShell>
  )
}
