import { useMemo, useState } from 'react'
import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

const amountInputClass =
  'h-10 w-full min-w-[120px] max-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-right text-sm font-semibold tabular-nums outline-none transition focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

function computeRunningBalances(installments, expectedPrincipal) {
  let allocated = 0
  return (installments || []).map((row) => {
    allocated += Number(row.emiAmount) || 0
    return Math.max(0, expectedPrincipal - allocated)
  })
}

export default function EmiScheduleTable({
  installments,
  expectedPrincipal = 0,
  onAmountChange,
  disabled = false,
}) {
  const [amountErrors, setAmountErrors] = useState({})

  const runningBalances = useMemo(
    () => computeRunningBalances(installments, expectedPrincipal),
    [installments, expectedPrincipal],
  )

  if (!installments?.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-sm text-[#686868]">
        Choose installment count and fee details to generate the schedule.
      </p>
    )
  }

  const handleAmountBlur = (row, rawValue) => {
    const amount = Number(rawValue)
    const key = row.installmentNo

    if (!rawValue || Number.isNaN(amount) || amount <= 0) {
      setAmountErrors((prev) => ({ ...prev, [key]: 'Amount must be greater than zero.' }))
      return
    }

    setAmountErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    onAmountChange?.(row, amount)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[min(480px,55vh)] overflow-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#246392] to-[#1a4d73] text-left text-[11px] font-bold uppercase tracking-wide text-white">
            <tr>
              <th className="w-14 px-5 py-3.5">#</th>
              <th className="min-w-[140px] px-5 py-3.5">Due date</th>
              <th className="min-w-[160px] px-5 py-3.5 text-right">Monthly amount</th>
              <th className="min-w-[160px] px-5 py-3.5 text-right">Remaining balance</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((row, idx) => {
              const error = amountErrors[row.installmentNo]
              const locked = disabled || ['Paid', 'Closed'].includes(row.status)

              return (
                <tr
                  key={row.installmentNo ?? idx}
                  className={cn(
                    'border-t border-slate-100 transition-colors hover:bg-[#f8fbff]/60',
                    idx % 2 === 1 && 'bg-slate-50/70',
                    error && 'bg-red-50/40',
                  )}
                >
                  <td className="px-5 py-4 align-middle text-base font-bold text-[#246392]">
                    {row.installmentNo}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 align-middle tabular-nums text-[#333]">
                    {formatCategoryDateTime(row.dueDate)}
                  </td>
                  <td className="px-5 py-4 align-middle">
                    <div className="flex flex-col items-end gap-1">
                      <div className="relative w-full max-w-[160px]">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#686868]">
                          ₹
                        </span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          disabled={locked}
                          defaultValue={row.emiAmount}
                          key={`${row.installmentNo}-${row.emiAmount}`}
                          onBlur={(e) => handleAmountBlur(row, e.target.value)}
                          className={cn(
                            amountInputClass,
                            'pl-7',
                            error ? 'border-[#df8284] focus:ring-[#df8284]/25' : '',
                            locked && 'cursor-not-allowed bg-slate-50 text-slate-500',
                          )}
                          aria-label={`Monthly amount for installment ${row.installmentNo}`}
                        />
                      </div>
                      {error && (
                        <p className="text-[10px] font-medium text-[#df8284]">{error}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 align-middle text-right text-sm font-semibold tabular-nums text-[#246392]">
                    {formatINR(runningBalances[idx])}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
