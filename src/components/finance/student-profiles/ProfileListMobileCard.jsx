import { Eye } from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

export default function ProfileListMobileCard({ row, onView }) {
  return (
    <article className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs font-semibold text-[#246392]">{row.id}</p>
          <p className="font-semibold text-[#222]">{row.studentName}</p>
          <p className="text-xs text-[#686868]">{row.primaryCourse}</p>
        </div>
        <span className={cn('rounded-md px-2 py-0.5 text-xs font-semibold', row.enrollmentSourceColor)}>
          {row.enrollmentSourceLabel}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div><dt className="text-[#686868]">Paid</dt><dd className="font-semibold">{formatINR(row.totalPaid)}</dd></div>
        <div><dt className="text-[#686868]">Pending</dt><dd className="font-semibold text-amber-700">{formatINR(row.totalPending)}</dd></div>
        <div><dt className="text-[#686868]">EMI</dt><dd><FinanceStatusBadge status={row.emiStatus} className="text-[10px]" /></dd></div>
        <div><dt className="text-[#686868]">Risk</dt><dd className="font-semibold">{row.riskScore}</dd></div>
        <div className="col-span-2"><dt className="text-[#686868]">Updated</dt><dd>{row.updatedAt ? formatCategoryDateTime(row.updatedAt) : '—'}</dd></div>
      </dl>
      <button
        type="button"
        onClick={() => onView(row)}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#55ace7]/30 py-2 text-sm font-semibold text-[#246392] hover:bg-[#eef6fc]"
      >
        <Eye className="h-4 w-4" /> View profile
      </button>
    </article>
  )
}
