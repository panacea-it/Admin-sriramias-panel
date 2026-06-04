import { motion } from 'framer-motion'
import { CalendarRange, Check, Settings2 } from 'lucide-react'
import { EMI_DURATION_PRESETS, EMI_SLIDER_MAX, EMI_SLIDER_MIN } from '../../../constants/offlinePaymentEmi'
import { formatINR } from '../../../utils/financeFilters'
import { formatDisplayDate, previewDurationOption } from '../../../utils/emiSchedule'
import { cn } from '../../../utils/cn'

export default function EmiDurationCards({
  config,
  onChange,
  financials,
  schedulePreview,
}) {
  const pending = financials?.pendingAmount ?? 0
  const down = Number(config.downPayment) || 0
  const startDate = config.startDate

  const setPreset = (presetId, months) => {
    if (presetId === 'custom') {
      onChange({ ...config, durationPreset: 'custom' })
      return
    }
    onChange({
      ...config,
      durationPreset: presetId,
      installmentCount: months,
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarRange className="h-4 w-4 text-[#246392]" />
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#246392]">
          EMI duration
        </h4>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {EMI_DURATION_PRESETS.map((preset) => {
          const isCustom = preset.id === 'custom'
          const isActive = config.durationPreset === preset.id
          const preview =
            !isCustom
              ? previewDurationOption({
                  months: preset.months,
                  pendingBalance: pending,
                  downPayment: down,
                  startDate,
                })
              : null

          return (
            <motion.button
              key={preset.id}
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setPreset(preset.id, preset.months)}
              className={cn(
                'relative rounded-xl border-2 p-3 text-left transition-all',
                isActive
                  ? 'border-[#246392] bg-gradient-to-br from-[#eef6fc] to-white shadow-lg ring-2 ring-[#55ace7]/25'
                  : 'border-slate-200 bg-white hover:border-[#55ace7]/40 hover:shadow-sm',
              )}
            >
              {isActive && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#246392] text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <p className="text-sm font-bold text-[#246392]">{preset.label}</p>
              {preview ? (
                <>
                  <p className="mt-2 text-xl font-bold tabular-nums text-[#111]">
                    {formatINR(preview.monthlyAmount)}
                    <span className="text-sm font-semibold text-[#686868]">/month</span>
                  </p>
                  <dl className="mt-3 space-y-1 text-xs text-[#555]">
                    <div className="flex justify-between gap-2">
                      <dt>Start</dt>
                      <dd className="font-semibold tabular-nums">{formatDisplayDate(preview.startDate)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>End</dt>
                      <dd className="font-semibold tabular-nums">{formatDisplayDate(preview.endDate)}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Total EMI</dt>
                      <dd className="font-semibold tabular-nums">{formatINR(preview.totalPrincipal)}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#686868]">
                  <Settings2 className="h-3.5 w-3.5" />
                  Set installments manually (2–24)
                </p>
              )}
            </motion.button>
          )
        })}
      </div>

      {config.durationPreset === 'custom' && (
        <motion.label
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="block rounded-lg border border-dashed border-[#55ace7]/30 bg-[#f8fbff] p-4"
        >
          <span className="text-sm font-semibold text-[#333]">Custom installment count</span>
          <input
            type="range"
            min={EMI_SLIDER_MIN}
            max={EMI_SLIDER_MAX}
            value={config.installmentCount}
            onChange={(e) =>
              onChange({ ...config, installmentCount: Number(e.target.value) })
            }
            className="mt-2 w-full accent-[#246392]"
          />
          <span className="mt-1 inline-block rounded-full bg-[#eef6fc] px-3 py-0.5 text-sm font-bold text-[#246392]">
            {config.installmentCount} installments
          </span>
        </motion.label>
      )}

      {schedulePreview?.endDate && (
        <p className="text-center text-xs text-[#686868]">
          Active plan: {formatINR(schedulePreview.avgEmi || 0)}/month avg · ends{' '}
          {formatDisplayDate(schedulePreview.endDate)}
        </p>
      )}
    </div>
  )
}
