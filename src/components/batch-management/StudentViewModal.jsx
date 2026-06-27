import {
  Mail,
  Phone,
  Hash,
  CreditCard,
  BarChart3,
  CalendarCheck,
  Loader2,
  User,
  BookOpen,
  Calendar,
} from 'lucide-react'
import BatchFormModalShell from './BatchFormModalShell'
import PaymentStatusBadge from './PaymentStatusBadge'
import ProgressBar from './ProgressBar'
import StudentEnrollmentStatusBadge from './StudentEnrollmentStatusBadge'

function SectionCard({ title, icon: Icon, children, className }) {
  return (
    <section
      className={`rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.04)] sm:p-5 ${className || ''}`}
    >
      <h3 className="mb-3 flex items-center gap-2 border-b border-slate-100 pb-2.5 text-xs font-bold uppercase tracking-wide text-[#246392]">
        {Icon ? <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} /> : null}
        {title}
      </h3>
      {children}
    </section>
  )
}

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9ca0a8]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
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
      subtitle={batch?.displayName ?? 'Enrollment overview'}
      size="lg"
      saving={loading}
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="h-11 rounded-xl border border-slate-200 bg-white px-8 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Close
          </button>
        </div>
      }
    >
      {showLoading ? (
        <ViewLoadingBody />
      ) : (
        <div className="space-y-4">
          <SectionCard title="Student Profile" icon={User}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#cbeeff] text-base font-bold text-[#246392]">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-[#1a3a5c]">{student.name}</p>
                <p className="mt-0.5 text-sm text-[#686868]">{student.email}</p>
                <p className="text-sm text-[#686868]">{student.phone}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <PaymentStatusBadge status={student.paymentStatus} />
                <StudentEnrollmentStatusBadge status={student.status} />
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-4 sm:grid-cols-2">
            <SectionCard title="Enrollment" icon={Hash}>
              <dl className="space-y-3">
                <DetailItem label="Enrollment ID">{student.enrollmentId}</DetailItem>
                <DetailItem label="Enrollment Date">{student.enrolledAt || '—'}</DetailItem>
              </dl>
            </SectionCard>

            <SectionCard title="Batch Information" icon={BookOpen}>
              <dl className="space-y-3">
                <DetailItem label="Batch">{batch?.displayName ?? '—'}</DetailItem>
                <DetailItem label="Course">{batch?.courseName ?? '—'}</DetailItem>
              </dl>
            </SectionCard>
          </div>

          <SectionCard title="Payments" icon={CreditCard}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DetailItem label="Fee Status">
                <PaymentStatusBadge status={student.paymentStatus} />
              </DetailItem>
              <p className="text-sm font-medium text-[#444]">{student.paymentStatus}</p>
            </div>
          </SectionCard>

          <SectionCard title="Attendance" icon={CalendarCheck}>
            <div className="flex items-end justify-between gap-4">
              <DetailItem label="Attendance Rate">{student.attendance}%</DetailItem>
            </div>
            <div className="mt-3">
              <ProgressBar value={student.attendance} />
            </div>
          </SectionCard>

          <SectionCard title="Progress" icon={BarChart3}>
            <div className="mb-3 flex items-center justify-between">
              <DetailItem label="Course Progress">{student.progress}%</DetailItem>
              <span className="text-xs font-medium text-[#686868]">
                <Calendar className="mr-1 inline h-3.5 w-3.5" />
                Updated with enrollment
              </span>
            </div>
            <ProgressBar value={student.progress} />
          </SectionCard>

          <SectionCard title="Status" icon={Calendar}>
            <div className="flex flex-wrap items-center gap-3">
              <StudentEnrollmentStatusBadge status={student.status} />
              <div className="text-sm text-[#686868]">
                <Mail className="mr-1 inline h-3.5 w-3.5" />
                {student.email}
              </div>
              <div className="text-sm text-[#686868]">
                <Phone className="mr-1 inline h-3.5 w-3.5" />
                {student.phone}
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </BatchFormModalShell>
  )
}
