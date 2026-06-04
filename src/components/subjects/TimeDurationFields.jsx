import { cn } from '../../utils/cn'

function TimeBox({ value, onChange, error, 'aria-label': ariaLabel }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      maxLength={2}
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      className={cn(
        'h-10 w-12 rounded-lg bg-[#d1e9f6] text-center text-sm font-semibold text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]/40',
        error && 'ring-2 ring-red-400',
      )}
    />
  )
}

export default function TimeDurationFields({
  label,
  required,
  hrs,
  min,
  sec,
  onHrsChange,
  onMinChange,
  onSecChange,
  error,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#333]">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <TimeBox
          value={hrs}
          onChange={onHrsChange}
          error={error}
          aria-label={`${label} hours`}
        />
        <span className="text-sm font-medium text-[#444]">Hrs :</span>
        <TimeBox
          value={min}
          onChange={onMinChange}
          error={error}
          aria-label={`${label} minutes`}
        />
        <span className="text-sm font-medium text-[#444]">Min :</span>
        <TimeBox
          value={sec}
          onChange={onSecChange}
          error={error}
          aria-label={`${label} seconds`}
        />
        <span className="text-sm font-medium text-[#444]">Sec</span>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
