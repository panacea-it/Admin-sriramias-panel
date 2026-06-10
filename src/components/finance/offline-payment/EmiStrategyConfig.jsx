import { useMemo } from 'react'
import { EMI_FREQUENCIES } from '../../../constants/offlinePaymentEmi'
import { formatINR } from '../../../utils/financeFilters'
import { installmentNetAmount } from '../../../utils/emiSchedule'
import EmiDurationCards from './EmiDurationCards'
import { cn } from '../../../utils/cn'

const fieldClass =
  'mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25'

export default function EmiStrategyConfig({
  config,
  onChange,
  financials,
  schedulePreview,
  installments = [],
}) {
  const set = (key, value) => onChange({ ...config, [key]: value })
  const pending = financials?.pendingAmount ?? 0
  const down = Number(config.downPayment) || 0
  const remainingAfterDown = Math.max(0, pending - down)

  const totals = useMemo(() => {
    const totalScheduled = (installments || []).reduce(
      (sum, row) => sum + (Number(row.emiAmount) || 0),
      0,
    )
    const balance = remainingAfterDown - totalScheduled
    const hasZeroAmount = (installments || []).some((row) => (Number(row.emiAmount) || 0) <= 0)
    const hasNegative = (installments || []).some((row) => installmentNetAmount(row) < 0)

    return { totalScheduled, balance, hasZeroAmount, hasNegative }
  }, [installments, remainingAfterDown])

  const validationMessages = useMemo(() => {
    const msgs = []
    const count = Number(config.installmentCount)
    if (count < 2 || count > 24) {
      msgs.push('Installment count must be between 2 and 24.')
    }
    if (down > pending) {
      msgs.push('Down payment cannot exceed remaining balance.')
    }
    if (totals.hasZeroAmount) {
      msgs.push('Each monthly amount must be greater than zero.')
    }
    if (totals.hasNegative) {
      msgs.push('Installment amounts cannot be negative.')
    }
    if (Math.abs(totals.balance) > 1 && installments.length > 0) {
      msgs.push(
        totals.balance > 0
          ? `₹${Math.abs(totals.balance).toLocaleString('en-IN')} remains unscheduled. Adjust monthly amounts.`
          : `Total EMI exceeds payable amount by ₹${Math.abs(totals.balance).toLocaleString('en-IN')}.`,
      )
    }
    return msgs
  }, [config.installmentCount, down, pending, totals, installments.length])

  return (
    <section className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-[#246392]">Custom installment plan</h3>

      <EmiDurationCards
        config={config}
        onChange={onChange}
        financials={financials}
        schedulePreview={schedulePreview}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-semibold text-[#555]">
          Down payment (₹)
          <input
            type="number"
            min="0"
            value={config.downPayment}
            onChange={(e) => set('downPayment', e.target.value)}
            className={fieldClass}
            placeholder="0"
          />
        </label>
        <label className="block text-xs font-semibold text-[#555]">
          EMI start date
          <input
            type="date"
            value={config.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block text-xs font-semibold text-[#555]">
          Frequency
          <select
            value={config.frequency}
            onChange={(e) => set('frequency', e.target.value)}
            className={fieldClass}
          >
            {EMI_FREQUENCIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-2 rounded-lg bg-[#f0f7fc] px-3 py-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="text-[#686868]">Remaining amount </span>
          <strong className="tabular-nums">{formatINR(remainingAfterDown)}</strong>
        </div>
        <div>
          <span className="text-[#686868]">Total scheduled </span>
          <strong className="tabular-nums">{formatINR(totals.totalScheduled)}</strong>
        </div>
        <div>
          <span className="text-[#686868]">Balance </span>
          <strong
            className={cn(
              'tabular-nums',
              Math.abs(totals.balance) > 1 ? 'text-[#df8284]' : 'text-[#69df66]',
            )}
          >
            {formatINR(totals.balance)}
          </strong>
        </div>
        <div>
          <span className="text-[#686868]">Total EMI </span>
          <strong className="tabular-nums">{formatINR(totals.totalScheduled)}</strong>
        </div>
      </div>

      {validationMessages.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {validationMessages.map((msg) => (
            <li key={msg}>• {msg}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
