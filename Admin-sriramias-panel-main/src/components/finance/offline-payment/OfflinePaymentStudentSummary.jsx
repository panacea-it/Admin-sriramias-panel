import { motion } from 'framer-motion'
import { GraduationCap, IndianRupee, User } from 'lucide-react'
import { formatINR } from '../../../utils/financeFilters'
import { cn } from '../../../utils/cn'

function SummaryRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="text-[#686868]">{label}</span>
      <span className={cn('font-semibold tabular-nums', highlight ? 'text-[#246392]' : 'text-[#111]')}>
        {value}
      </span>
    </div>
  )
}

export default function OfflinePaymentStudentSummary({ financials, loading }) {
  if (!financials && !loading) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-[#686868]">
        Select a student and course to load financial summary.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  const f = financials

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
        <div className="mb-3 flex items-center gap-2 text-[#246392]">
          <User className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Student profile</span>
        </div>
        <p className="text-lg font-bold text-[#111]">{f.studentName}</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-[#686868]">Application ID</dt>
            <dd className="font-mono font-semibold text-[#333]">{f.applicationId}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#686868]">Batch</dt>
            <dd className="font-medium text-[#111]">{f.batchName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#686868]">Course</dt>
            <dd className="text-right font-medium text-[#111]">{f.courseName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-[#686868]">Duration</dt>
            <dd className="font-medium text-[#111]">{f.courseDuration}</dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-[#55ace7]/15 bg-gradient-to-br from-[#f8fbff] to-white p-4 shadow-[0_4px_20px_rgba(36,99,146,0.08)]">
        <div className="mb-3 flex items-center gap-2 text-[#246392]">
          <IndianRupee className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-wide">Financial summary</span>
        </div>
        <div className="space-y-2">
          <SummaryRow label="Total course fee" value={formatINR(f.totalCourseFee)} />
          <SummaryRow label="Discount" value={`- ${formatINR(f.discount)}`} />
          <SummaryRow label="Scholarship" value={`- ${formatINR(f.scholarship)}`} />
          <SummaryRow label={`GST (${f.gstPercent}%)`} value={formatINR(f.gst)} />
          <div className="my-2 border-t border-slate-100" />
          <SummaryRow label="Final payable" value={formatINR(f.finalPayable)} highlight />
          <SummaryRow label="Amount paid" value={formatINR(f.amountPaid)} />
          <SummaryRow label="Remaining balance" value={formatINR(f.pendingAmount)} highlight />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-[#686868]">
          <GraduationCap className="h-3.5 w-3.5" />
          {f.courseType} · {f.centerName}
        </p>
      </div>
    </motion.div>
  )
}
