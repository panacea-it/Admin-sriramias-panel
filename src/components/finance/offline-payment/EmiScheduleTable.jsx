import { useMemo, useState } from 'react'
import { CheckCircle2, Pencil } from 'lucide-react'
import FinanceStatusBadge from '../FinanceStatusBadge'
import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import {
  installmentDueAmount,
  installmentPaidAmount,
  installmentRemaining,
} from '../../../utils/emiSchedule'
import { cn } from '../../../utils/cn'

function computeRunningBalances(installments, expectedPrincipal) {
  let allocated = 0
  return (installments || []).map((row) => {
    allocated += Number(row.emiAmount) || 0
    return Math.max(0, expectedPrincipal - allocated)
  })
}

export default function EmiScheduleTable({
  installments,
  planClosed,
  onCollect,
  onEdit,
  onAmountChange,
  expectedPrincipal = 0,
  customLayout = false,
}) {
  const [amountErrors, setAmountErrors] = useState({})

  const runningBalances = useMemo(
    () => computeRunningBalances(installments, expectedPrincipal),
    [installments, expectedPrincipal],
  )

  if (!installments?.length) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-sm text-[#686868]">
        Choose EMI duration and fee details to generate the schedule.
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
    if (amount < 0) {
      setAmountErrors((prev) => ({ ...prev, [key]: 'Amount cannot be negative.' }))
      return
    }

    setAmountErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    onAmountChange?.(row, amount)
  }

  if (customLayout) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[min(320px,42vh)] overflow-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-[#246392] text-left text-[11px] font-bold uppercase tracking-wide text-white">
              <tr>
                <th className="px-3 py-2.5">Installment no.</th>
                <th className="px-3 py-2.5">Due date</th>
                <th className="px-3 py-2.5 text-right">Monthly amount</th>
                <th className="px-3 py-2.5 text-right">Remaining balance</th>
                <th className="px-3 py-2.5 text-center">Status</th>
                <th className="px-3 py-2.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((row, idx) => {
                const error = amountErrors[row.installmentNo]
                const canCollect =
                  !planClosed && !['Paid', 'Closed'].includes(row.status) && installmentRemaining(row) > 0

                return (
                  <tr
                    key={row.installmentNo ?? idx}
                    className={cn(
                      'border-t border-slate-100',
                      idx % 2 === 1 && 'bg-slate-50/80',
                      error && 'bg-red-50/40',
                    )}
                  >
                    <td className="px-3 py-2 font-bold text-[#246392]">{row.installmentNo}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-[#333]">
                      {formatCategoryDateTime(row.dueDate)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        defaultValue={row.emiAmount}
                        key={`${row.installmentNo}-${row.emiAmount}`}
                        onBlur={(e) => handleAmountBlur(row, e.target.value)}
                        className={cn(
                          'h-9 w-full min-w-[100px] rounded-lg border bg-white px-2 text-right text-sm font-semibold tabular-nums outline-none focus:ring-2 focus:ring-[#55ace7]/30',
                          error ? 'border-[#df8284]' : 'border-slate-200',
                        )}
                        aria-label={`Monthly amount for installment ${row.installmentNo}`}
                      />
                      {error && <p className="mt-0.5 text-[10px] text-[#df8284]">{error}</p>}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums text-[#246392]">
                      {formatINR(runningBalances[idx])}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <FinanceStatusBadge status={row.status} className="text-[10px]" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        {canCollect && (
                          <button
                            type="button"
                            title="Collect payment"
                            onClick={() => onCollect(row)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#246392] px-2.5 text-xs font-semibold text-white hover:bg-[#1a4d73]"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Pay
                          </button>
                        )}
                        {!planClosed && (
                          <button
                            type="button"
                            title="Edit details"
                            onClick={() => onEdit(row)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#246392] hover:bg-[#eef6fc]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
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

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="max-h-[min(280px,38vh)] overflow-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-[#246392] text-left text-[11px] font-bold uppercase tracking-wide text-white">
            <tr>
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Due date</th>
              <th className="px-3 py-2.5 text-right">EMI</th>
              <th className="px-3 py-2.5 text-right">Paid</th>
              <th className="px-3 py-2.5 text-right">Remaining</th>
              <th className="px-3 py-2.5 text-center">Status</th>
              <th className="px-3 py-2.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((row, idx) => {
              const due = installmentDueAmount(row)
              const paid = installmentPaidAmount(row)
              const remaining = installmentRemaining(row)
              const canCollect =
                !planClosed && !['Paid', 'Closed'].includes(row.status) && remaining > 0

              return (
                <tr
                  key={row.installmentNo ?? idx}
                  className={cn(
                    'border-t border-slate-100',
                    idx % 2 === 1 && 'bg-slate-50/80',
                    row.status === 'Overdue' && 'bg-red-50/50',
                    row.status === 'Paid' && 'bg-emerald-50/40',
                    row.status === 'Closed' && 'bg-slate-100/80 opacity-75',
                  )}
                >
                  <td className="px-3 py-2 font-bold text-[#246392]">{row.installmentNo}</td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-[#333]">
                    {formatCategoryDateTime(row.dueDate)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatINR(due)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700">
                    {formatINR(paid)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums text-[#246392]">
                    {formatINR(remaining)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <FinanceStatusBadge status={row.status} className="text-[10px]" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      {canCollect && (
                        <button
                          type="button"
                          title="Collect payment"
                          onClick={() => onCollect(row)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#246392] px-2.5 text-xs font-semibold text-white hover:bg-[#1a4d73]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Pay
                        </button>
                      )}
                      {!planClosed && (
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => onEdit(row)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#246392] hover:bg-[#eef6fc]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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
