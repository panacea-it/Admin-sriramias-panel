import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchAvailableClassrooms } from '../api/classroomsAPI'
import { durationFromHms, minutesToTimeString, timePartsToMinutes } from '../utils/classroomTime'

function resolveStartTime({ startTime, timeHrs, timeMin, timeSec }) {
  if (startTime) return startTime
  if (timeHrs != null || timeMin != null) {
    return minutesToTimeString(timePartsToMinutes(timeHrs, timeMin, timeSec))
  }
  return ''
}

function resolveDuration({ durationMinutes, durationHrs, durationMin, durationSec }) {
  if (durationMinutes != null) return Number(durationMinutes) || 60
  return durationFromHms(durationHrs, durationMin, durationSec)
}

export function useClassroomAvailability({
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
  enabled = true,
}) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const resolvedStart = resolveStartTime({ startTime, timeHrs, timeMin, timeSec })
  const resolvedDuration = resolveDuration({
    durationMinutes,
    durationHrs,
    durationMin,
    durationSec,
  })

  const excludeKey = useMemo(() => excludeSourceIds.join(','), [excludeSourceIds])

  const refresh = useCallback(async () => {
    if (!enabled || !date || !resolvedStart) {
      setOptions([])
      return
    }
    setLoading(true)
    setError(null)
    const controller = new AbortController()
    try {
      const list = await fetchAvailableClassrooms({
        date,
        startTime: resolvedStart,
        durationMinutes: resolvedDuration,
        excludeSourceIds,
        signal: controller.signal,
      })
      setOptions(list)
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message || 'Failed to load classrooms')
    } finally {
      setLoading(false)
    }
    return () => controller.abort()
  }, [enabled, date, resolvedStart, resolvedDuration, excludeKey, excludeSourceIds])

  useEffect(() => {
    const t = setTimeout(refresh, 320)
    return () => clearTimeout(t)
  }, [refresh])

  const occupiedIds = useMemo(
    () => new Set(options.filter((o) => o.occupied).map((o) => o.id)),
    [options],
  )

  return {
    options,
    loading,
    error,
    occupiedIds,
    resolvedStart,
    resolvedDuration,
    refresh,
  }
}
