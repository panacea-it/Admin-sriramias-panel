import { EMI_FREQUENCIES } from '../../../constants/offlinePaymentEmi'
import { formatINR } from '../../../utils/financeFilters'
import EmiDurationCards from './EmiDurationCards'

const fieldClass =
  'mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25'

export default function EmiStrategyConfig({
  config,
  onChange,
  financials,
  schedulePreview,
}) {
  const set = (key, value) => onChange({ ...config, [key]: value })
  const remainingAfterDown = Math.max(
    0,
    (financials?.pendingAmount ?? 0) - (Number(config.downPayment) || 0),
  )

  return (
    <section className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-bold text-[#246392]">EMI plan configuration</h3>

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

      <div className="flex flex-wrap gap-4 rounded-lg bg-[#f0f7fc] px-3 py-2 text-xs">
        <span>
          <span className="text-[#686868]">Monthly avg </span>
          <strong>{formatINR(schedulePreview?.avgEmi || 0)}</strong>
        </span>
        <span>
          <span className="text-[#686868]">EMI principal </span>
          <strong>{formatINR(schedulePreview?.totalEmiAmount || 0)}</strong>
        </span>
        <span>
          <span className="text-[#686868]">After down pay </span>
          <strong>{formatINR(remainingAfterDown)}</strong>
        </span>
      </div>
    </section>
  )
}
