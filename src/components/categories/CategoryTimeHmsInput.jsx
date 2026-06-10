import { cn } from '../../utils/cn'
import { categoryInputClass } from './CategoryFormField'

const segmentClass =
  'h-11 w-14 shrink-0 rounded-lg bg-[#e8f4fc] px-1 text-center text-sm font-semibold text-[#222] outline-none transition focus:ring-2 focus:ring-[#55ace7] sm:w-16'

function clampSegment(value, max) {
  const n = parseInt(String(value).replace(/\D/g, ''), 10)
  if (Number.isNaN(n)) return '00'
  return String(Math.min(max, Math.max(0, n))).padStart(2, '0')
}

function Segment({ value, onChange, max, ariaLabel }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={2}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(clampSegment(e.target.value, max))}
      onBlur={(e) => onChange(clampSegment(e.target.value, max))}
      className={segmentClass}
    />
  )
}

export default function CategoryTimeHmsInput({ hrs, min, sec, onChange, className }) {
  const set = (key, val) => onChange({ hrs, min, sec, [key]: val })

  return (
    <div className={cn('flex flex-wrap items-center gap-1 sm:gap-1.5', className)} role="group">
      <Segment
        value={hrs}
        max={23}
        ariaLabel="Hours"
        onChange={(v) => set('hrs', v)}
      />
      <span className="text-xs font-medium text-[#686868]">Hrs</span>
      <span className="px-0.5 text-sm font-semibold text-[#9ca0a8]">:</span>
      <Segment
        value={min}
        max={59}
        ariaLabel="Minutes"
        onChange={(v) => set('min', v)}
      />
      <span className="text-xs font-medium text-[#686868]">Min</span>
      <span className="px-0.5 text-sm font-semibold text-[#9ca0a8]">:</span>
      <Segment value={sec} max={59} ariaLabel="Seconds" onChange={(v) => set('sec', v)} />
      <span className="text-xs font-medium text-[#686868]">Sec</span>
    </div>
  )
}
