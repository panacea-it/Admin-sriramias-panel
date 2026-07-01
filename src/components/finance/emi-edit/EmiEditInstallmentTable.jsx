import { IndianRupee, Pencil } from 'lucide-react'
import IconActionButton from '../../common/IconActionButton'
import FinanceStatusBadge from '../FinanceStatusBadge'
import { formatINR } from '../../../utils/financeFilters'
import { formatDisplayDate, installmentRemaining } from '../../../utils/emiSchedule'
import { canCustomizeInstallment, canPayInstallment } from '../../../utils/emiManagementHelpers'
import { cn } from '../../../utils/cn'

export default function EmiEditInstallmentTable({
  installments,
  planClosed,
  onCustomize,
  onPay,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="max-h-[min(480px,55vh)] overflow-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-[#55ace7] via-[#4a8fc4] to-[#246392] text-left text-[11px] font-bold uppercase tracking-wide text-white">
              <th className="w-14 px-4 py-4 first:pl-5 sm:first:pl-6">#</th>
              <th className="min-w-[120px] px-4 py-4">EMI Month</th>
              <th className="min-w-[120px] px-4 py-4">Due Date</th>
              <th className="min-w-[120px] px-4 py-4 text-right">EMI Amount</th>
              <th className="min-w-[110px] px-4 py-4 text-right">Paid Amount</th>
              <th className="min-w-[110px] px-4 py-4 text-right">Balance</th>
              <th className="min-w-[120px] px-4 py-4">Status</th>
              <th className="w-[120px] px-4 py-4 text-center last:pr-5 sm:last:pr-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((row, index) => {
              const isPaid = ['Paid', 'Closed'].includes(row.status)
              const isPartial = row.status === 'Partial'
              const locked = planClosed || row.status === 'Closed'
              const remaining = row.remainingBalance ?? installmentRemaining(row)
              const allowCustomize = !locked && canCustomizeInstallment(row)
              const allowPay = !locked && canPayInstallment(row)

              return (
                <tr
                  key={`${row.installmentNo}-${index}`}
                  className={cn(
                    'min-h-[56px] border-b border-slate-100 transition-colors duration-200 last:border-0 hover:bg-[#eef6fc]/70',
                    index % 2 === 1 && 'bg-slate-50/50',
                    row.status === 'Overdue' && 'bg-red-50/35',
                    isPaid && 'bg-emerald-50/25',
                    isPartial && 'bg-amber-50/30',
                    row.status === 'Closed' && 'opacity-75',
                  )}
                >
                  <td className="px-4 py-4 align-middle text-base font-bold tabular-nums text-[#246392] first:pl-5 sm:first:pl-6">
                    {row.installmentNo}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 align-middle font-medium text-[#333]">
                    {row.emiMonth}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 align-middle tabular-nums text-[#333]">
                    {formatDisplayDate(row.dueDate)}
                  </td>
                  <td className="px-4 py-4 align-middle text-right text-sm font-semibold tabular-nums text-[#111]">
                    {formatINR(row.emiAmount)}
                  </td>
                  <td className="px-4 py-4 align-middle text-right text-sm font-semibold tabular-nums text-emerald-700">
                    {formatINR(row.paidAmount ?? 0)}
                  </td>
                  <td className="px-4 py-4 align-middle text-right text-sm font-bold tabular-nums text-[#246392]">
                    {formatINR(remaining)}
                  </td>
                  <td className="px-4 py-4 align-middle">
                    <FinanceStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-4 align-middle last:pr-5 sm:last:pr-6">
                    <div className="flex items-center justify-center gap-2.5">
                      <IconActionButton
                        label="Customize Installment"
                        disabled={!allowCustomize}
                        onClick={() => onCustomize?.(index)}
                        className="border border-[#55ace7]/35 text-[#246392] hover:border-[#55ace7] hover:bg-[#eef6fc] hover:shadow-sm"
                      >
                        <Pencil className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
                      </IconActionButton>
                      <button
                        type="button"
                        disabled={!allowPay}
                        onClick={() => onPay?.(index)}
                        className={cn(
                          'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-3 text-xs font-bold text-white shadow-sm transition',
                          'hover:from-[#4a9ad8] hover:to-[#1a4d73] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40',
                          'disabled:cursor-not-allowed disabled:opacity-45',
                        )}
                      >
                        <IndianRupee className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        Pay
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {installments.length === 0 && (
        <p className="py-12 text-center text-sm font-medium text-[#686868]">
          No installments. Add one to begin.
        </p>
      )}
    </div>
  )
}
