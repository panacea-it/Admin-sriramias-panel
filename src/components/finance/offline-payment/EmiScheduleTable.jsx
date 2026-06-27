import { useMemo, useState } from 'react'
import { CheckCircle2, Pencil } from 'lucide-react'
import { formatINR } from '../../../utils/financeFilters'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import {
  installmentDueAmount,
  installmentPaidAmount,
  installmentRemaining,
} from '../../../utils/emiSchedule'
import { cn } from '../../../utils/cn'

const EDITABLE_STATUSES = ['Pending', 'Scheduled', 'Paid', 'Overdue', 'Cancelled']

const statusSelectClass =
  'h-9 w-full min-w-[110px] rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-[#333] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500'

const amountInputClass =
  'h-10 w-full min-w-[110px] rounded-lg border border-slate-200 bg-white px-3 text-right text-sm font-semibold tabular-nums outline-none transition focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25'

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
  onStatusChange,
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

  const handleStatusChange = (row, status) => {
    onStatusChange?.(row, status)
  }

  if (customLayout) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[min(480px,55vh)] overflow-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#246392] to-[#1a4d73] text-left text-[11px] font-bold uppercase tracking-wide text-white">
              <tr>
                <th className="w-16 px-4 py-3.5">#</th>
                <th className="min-w-[120px] px-4 py-3.5">Due date</th>
                <th className="min-w-[140px] px-4 py-3.5 text-right">Monthly amount</th>
                <th className="min-w-[140px] px-4 py-3.5 text-right">Remaining balance</th>
                <th className="min-w-[130px] px-4 py-3.5">Status</th>
                <th className="w-36 px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {installments.map((row, idx) => {
                const error = amountErrors[row.installmentNo]
                const locked = planClosed || row.status === 'Closed'
                const canCollect =
                  !planClosed && !['Paid', 'Closed'].includes(row.status) && installmentRemaining(row) > 0

                return (
                  <tr
                    key={row.installmentNo ?? idx}
                    className={cn(
                      'border-t border-slate-100 transition-colors hover:bg-[#f8fbff]/60',
                      idx % 2 === 1 && 'bg-slate-50/70',
                      error && 'bg-red-50/40',
                      row.status === 'Overdue' && 'bg-red-50/30',
                      row.status === 'Paid' && 'bg-emerald-50/25',
                    )}
                  >
                    <td className="px-4 py-3.5 align-middle text-base font-bold text-[#246392]">
                      {row.installmentNo}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 align-middle tabular-nums text-[#333]">
                      {formatCategoryDateTime(row.dueDate)}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
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
                          error ? 'border-[#df8284] focus:ring-[#df8284]/25' : '',
                          locked && 'cursor-not-allowed bg-slate-50 text-slate-500',
                        )}
                        aria-label={`Monthly amount for installment ${row.installmentNo}`}
                      />
                      {error && <p className="mt-1 text-[10px] font-medium text-[#df8284]">{error}</p>}
                    </td>
                    <td className="px-4 py-3.5 align-middle text-right text-sm font-semibold tabular-nums text-[#246392]">
                      {formatINR(runningBalances[idx])}
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <select
                        value={row.status}
                        disabled={locked}
                        onChange={(e) => handleStatusChange(row, e.target.value)}
                        className={statusSelectClass}
                        aria-label={`Status for installment ${row.installmentNo}`}
                      >
                        {!EDITABLE_STATUSES.includes(row.status) && row.status && (
                          <option value={row.status}>{row.status}</option>
                        )}
                        {EDITABLE_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {canCollect && (
                          <button
                            type="button"
                            title="Collect payment"
                            onClick={() => onCollect?.(row)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#246392] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1a4d73]"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Pay
                          </button>
                        )}
                        {!planClosed && (
                          <button
                            type="button"
                            title="Edit details"
                            onClick={() => onEdit?.(row)}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[#246392] transition hover:border-[#55ace7]/40 hover:bg-[#eef6fc]"
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
      <div className="max-h-[min(420px,50vh)] overflow-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-gradient-to-r from-[#246392] to-[#1a4d73] text-left text-[11px] font-bold uppercase tracking-wide text-white">
            <tr>
              <th className="w-14 px-4 py-3.5">#</th>
              <th className="min-w-[120px] px-4 py-3.5">Due date</th>
              <th className="min-w-[100px] px-4 py-3.5 text-right">EMI</th>
              <th className="min-w-[100px] px-4 py-3.5 text-right">Paid</th>
              <th className="min-w-[110px] px-4 py-3.5 text-right">Remaining</th>
              <th className="min-w-[130px] px-4 py-3.5">Status</th>
              <th className="w-36 px-4 py-3.5 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {installments.map((row, idx) => {
              const due = installmentDueAmount(row)
              const paid = installmentPaidAmount(row)
              const remaining = installmentRemaining(row)
              const locked = planClosed || row.status === 'Closed'
              const canCollect =
                !planClosed && !['Paid', 'Closed'].includes(row.status) && remaining > 0

              return (
                <tr
                  key={row.installmentNo ?? idx}
                  className={cn(
                    'border-t border-slate-100 transition-colors hover:bg-[#f8fbff]/60',
                    idx % 2 === 1 && 'bg-slate-50/70',
                    row.status === 'Overdue' && 'bg-red-50/40',
                    row.status === 'Paid' && 'bg-emerald-50/30',
                    row.status === 'Closed' && 'bg-slate-100/80 opacity-75',
                  )}
                >
                  <td className="px-4 py-3.5 align-middle font-bold text-[#246392]">{row.installmentNo}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 align-middle tabular-nums text-[#333]">
                    {formatCategoryDateTime(row.dueDate)}
                  </td>
                  <td className="px-4 py-3.5 align-middle text-right font-semibold tabular-nums">
                    {formatINR(due)}
                  </td>
                  <td className="px-4 py-3.5 align-middle text-right tabular-nums text-emerald-700">
                    {formatINR(paid)}
                  </td>
                  <td className="px-4 py-3.5 align-middle text-right font-medium tabular-nums text-[#246392]">
                    {formatINR(remaining)}
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <select
                      value={row.status}
                      disabled={locked}
                      onChange={(e) => handleStatusChange(row, e.target.value)}
                      className={statusSelectClass}
                      aria-label={`Status for installment ${row.installmentNo}`}
                    >
                      {!EDITABLE_STATUSES.includes(row.status) && row.status && (
                        <option value={row.status}>{row.status}</option>
                      )}
                      {EDITABLE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <div className="flex items-center justify-center gap-2">
                      {canCollect && (
                        <button
                          type="button"
                          title="Collect payment"
                          onClick={() => onCollect?.(row)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#246392] px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1a4d73]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Pay
                        </button>
                      )}
                      {!planClosed && (
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => onEdit?.(row)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-[#246392] transition hover:border-[#55ace7]/40 hover:bg-[#eef6fc]"
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
