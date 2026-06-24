import { useMemo } from 'react'
import { installmentNetAmount } from '../../../utils/emiSchedule'
import EmiDurationCards from './EmiDurationCards'

const CUSTOM_INSTALLMENT_MAX = 24

export default function EmiStrategyConfig({
  config,
  onChange,
  financials,
  installments = [],
}) {
  const pending = financials?.pendingAmount ?? 0
  const down = Number(config.downPayment) || 0
  const remainingAfterDown = Math.max(0, pending - down)

  const validationMessages = useMemo(() => {
    const msgs = []
    const count = Number(config.installmentCount)

    if (config.durationPreset === 'custom') {
      if (config.installmentCount === '' || config.installmentCount == null) {
        msgs.push('Enter the number of installments.')
      } else if (count < 0) {
        msgs.push('Installment count cannot be negative.')
      } else if (count > CUSTOM_INSTALLMENT_MAX) {
        msgs.push(`Installment count cannot exceed ${CUSTOM_INSTALLMENT_MAX}.`)
      }
    } else if (config.installmentCount !== '' && count < 0) {
      msgs.push('Installment count cannot be negative.')
    }

    if (down > pending) {
      msgs.push('Down payment cannot exceed remaining balance.')
    }

    const totalScheduled = (installments || []).reduce(
      (sum, row) => sum + (Number(row.emiAmount) || 0),
      0,
    )
    const balance = remainingAfterDown - totalScheduled
    const hasZeroAmount = (installments || []).some((row) => (Number(row.emiAmount) || 0) <= 0)
    const hasNegative = (installments || []).some((row) => installmentNetAmount(row) < 0)

    if (hasZeroAmount && installments.length > 0) {
      msgs.push('Each monthly amount must be greater than zero.')
    }
    if (hasNegative) {
      msgs.push('Installment amounts cannot be negative.')
    }
    if (Math.abs(balance) > 1 && installments.length > 0) {
      msgs.push(
        balance > 0
          ? `₹${Math.abs(balance).toLocaleString('en-IN')} remains unscheduled. Adjust monthly amounts.`
          : `Total EMI exceeds payable amount by ₹${Math.abs(balance).toLocaleString('en-IN')}.`,
      )
    }
    return msgs
  }, [config.installmentCount, config.durationPreset, down, pending, installments, remainingAfterDown])

  return (
    <section className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-bold text-[#246392]">Installment plan</h3>

      <EmiDurationCards config={config} onChange={onChange} financials={financials} />

      {validationMessages.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
          {validationMessages.map((msg) => (
            <li key={msg}>• {msg}</li>
          ))}
        </ul>
      )}
    </section>
  )
}
