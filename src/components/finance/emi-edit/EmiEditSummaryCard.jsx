import { Mail, Phone, CalendarRange } from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import { formatINR } from '../../../utils/financeFilters'
import { formatDisplayDate } from '../../../utils/emiSchedule'
import { cn } from '../../../utils/cn'

export default function EmiEditSummaryCard({ plan, analytics }) {
  if (!plan) return null

  const completion = plan.completionPercent ?? analytics?.collectionPct ?? 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-[#f8fbff] to-white px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#111]">{plan.studentName}</h3>
            <p className="text-sm text-[#686868]">{plan.courseName}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#555]">
              {plan.mobile && (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-[#246392]" />
                  {plan.mobile}
                </span>
              )}
              {plan.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-[#246392]" />
                  {plan.email}
                </span>
              )}
            </div>
          </div>
          <FinanceStatusBadge status={plan.planStatus || 'EMI Running'} />
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
        <div className="rounded-lg bg-[#eef6fc] px-3 py-2.5 text-xs">
          <p className="font-semibold uppercase tracking-wide text-[#246392]">EMI schedule</p>
          <p className="mt-1 flex items-center gap-1 font-medium text-[#333]">
            <CalendarRange className="h-3.5 w-3.5" />
            {formatDisplayDate(plan.emiStartDate)} — {formatDisplayDate(plan.emiEndDate)}
          </p>
          <p className="mt-0.5 text-[#686868]">{plan.emiDurationMonths || '—'} installments</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:col-span-1 lg:col-span-2">
          <Stat label="Total fee" value={formatINR(plan.totalFees)} />
          <Stat label="Paid" value={formatINR(plan.totalPaid ?? plan.amountPaid ?? 0)} accent="text-emerald-700" />
          <Stat label="Pending" value={formatINR(plan.pendingAmount)} accent="text-[#246392]" />
          <Stat
            label="Overdue"
            value={formatINR(plan.overdueAmount ?? analytics?.overdueEmi ?? 0)}
            accent="text-red-600"
          />
        </div>

        <div className="flex flex-col justify-center sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs font-semibold text-[#333]">
            <span>EMI completion</span>
            <span className="text-[#246392]">{completion}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#55ace7] to-[#246392] transition-all"
              style={{ width: `${Math.min(100, completion)}%` }}
            />
          </div>
          {analytics?.nextDueDate && (
            <p className="mt-2 text-xs text-[#686868]">
              Next due:{' '}
              <span className="font-semibold text-[#246392]">
                {formatDisplayDate(analytics.nextDueDate)}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-slate-100 px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#888]">{label}</p>
      <p className={cn('mt-0.5 text-sm font-bold tabular-nums', accent || 'text-[#111]')}>{value}</p>
    </div>
  )
}
