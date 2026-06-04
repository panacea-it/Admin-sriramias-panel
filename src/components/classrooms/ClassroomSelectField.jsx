import { useEffect } from 'react'
import { cn } from '../../utils/cn'
import { useClassroomAvailability } from '../../hooks/useClassroomAvailability'
import { findClassroomById } from '../../utils/classroomsStorage'

export default function ClassroomSelectField({
  value,
  onChange,
  date,
  startTime,
  timeHrs,
  timeMin,
  timeSec,
  durationMinutes,
  durationHrs,
  durationMin,
  durationSec,
  excludeSourceIds = [],
  error,
  required,
  label = 'Select Classroom',
  showLabel = true,
  disabled,
  className,
}) {
  const { options, loading, occupiedIds } = useClassroomAvailability({
    date,
    startTime,
    timeHrs,
    timeMin,
    timeSec,
    durationMinutes,
    durationHrs,
    durationMin,
    durationSec,
    excludeSourceIds,
    enabled: Boolean(date),
  })

  const selected = findClassroomById(value)
  const hasSchedule = Boolean(date && (startTime || timeHrs != null))

  useEffect(() => {
    if (!value || !hasSchedule || loading) return
    if (occupiedIds.has(value)) {
      onChange?.('')
    }
  }, [value, hasSchedule, loading, occupiedIds, onChange])

  return (
    <div className={className}>
      {showLabel && label ? (
        <label className="mb-1.5 block text-sm font-medium text-[#333]">
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
      ) : null}
      <select
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled || loading}
        className={cn(
          'h-11 w-full rounded-xl bg-[#d1e9f6] px-4 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]/40',
          error && 'ring-2 ring-red-400',
          (disabled || loading) && 'opacity-70',
        )}
      >
        <option value="">
          {loading ? 'Checking availability…' : 'Choose Classroom'}
        </option>
        {options.map((room) => {
          const occupied = room.occupied
          return (
            <option key={room.id} value={room.id} disabled={occupied}>
              {occupied ? '❌ ' : '✅ '}
              {room.name} ({room.code})
              {occupied ? ' — Occupied' : ' — Available'}
            </option>
          )
        })}
        {selected && !options.find((o) => o.id === value) && (
          <option value={value}>
            {selected.name} ({selected.code})
          </option>
        )}
      </select>
      {hasSchedule && !loading && options.length > 0 && (
        <p className="mt-1 text-[11px] text-[#64748b]">
          {options.filter((o) => o.available).length} available ·{' '}
          {options.filter((o) => o.occupied).length} occupied
        </p>
      )}
      {!date && (
        <p className="mt-1 text-[11px] text-[#94a3b8]">Select date & time to see availability</p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
