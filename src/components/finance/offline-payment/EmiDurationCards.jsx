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

  const handleCustomCountChange = (raw) => {
    const parsed = Number.parseInt(raw, 10)
    if (Number.isNaN(parsed)) return
    const clamped = Math.min(EMI_SLIDER_MAX, Math.max(EMI_SLIDER_MIN, parsed))
    onChange({ ...config, installmentCount: clamped, durationPreset: 'custom' })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CalendarRange className="h-4 w-4 text-[#246392]" />
        <h4 className="text-xs font-bold uppercase tracking-wide text-[#246392]">Number of months</h4>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
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
                  <p className="mt-2 text-lg font-bold tabular-nums text-[#111]">
                    {formatINR(preview.monthlyAmount)}
                    <span className="text-xs font-semibold text-[#686868]">/mo</span>
                  </p>
                  <p className="mt-1 text-[10px] text-[#686868]">
                    Ends {formatDisplayDate(preview.endDate)}
                  </p>
                </>
              ) : (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[#686868]">
                  <Settings2 className="h-3.5 w-3.5" />
                  Enter custom count ({EMI_SLIDER_MIN}–{EMI_SLIDER_MAX})
                </p>
              )}
            </motion.button>
          )
        })}
      </div>

      {config.durationPreset === 'custom' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-lg border border-dashed border-[#55ace7]/30 bg-[#f8fbff] p-4"
        >
          <label className="block text-sm font-semibold text-[#333]">
            Custom number of months
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                type="number"
                min={EMI_SLIDER_MIN}
                max={EMI_SLIDER_MAX}
                value={config.installmentCount}
                onChange={(e) => handleCustomCountChange(e.target.value)}
                className="h-10 w-28 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold tabular-nums outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25"
              />
              <span className="rounded-full bg-[#eef6fc] px-3 py-1 text-sm font-bold text-[#246392]">
                {config.installmentCount} installments
              </span>
            </div>
          </label>
        </motion.div>
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
