import { useCallback, useMemo, useState } from 'react'
import {
  CALENDAR_SESSION_TYPES,
  lessonsToCalendarEvents,
  matchesExtraCenters,
  matchesHeaderCenter,
} from '../utils/calendarEvents'

const DEFAULT_FILTERS = {
  search: '',
  faculty: 'all',
  subject: 'all',
  status: 'all',
  sessionType: 'all',
  classroom: 'all',
  extraCenters: [],
}

export function useCalendarFilters(lessons, headerCenter = 'All Centers') {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const allEvents = useMemo(() => lessonsToCalendarEvents(lessons), [lessons])

  const facultyOptions = useMemo(() => {
    const set = new Set(allEvents.map((e) => e.faculty).filter(Boolean))
    return ['all', ...[...set].sort()]
  }, [allEvents])

  const subjectOptions = useMemo(() => {
    const set = new Set(allEvents.map((e) => e.subject).filter(Boolean))
    return ['all', ...[...set].sort()]
  }, [allEvents])

  const statusOptions = useMemo(() => {
    const set = new Set(allEvents.map((e) => e.status).filter(Boolean))
    return ['all', ...[...set].sort()]
  }, [allEvents])

  const classroomOptions = useMemo(() => {
    const set = new Set(allEvents.map((e) => e.classroom).filter(Boolean))
    return ['all', ...[...set].sort()]
  }, [allEvents])

  const filteredEvents = useMemo(() => {
    const q = filters.search.trim().toLowerCase()
    return allEvents.filter((event) => {
      if (!matchesHeaderCenter(event, headerCenter)) return false
      if (!matchesExtraCenters(event, filters.extraCenters)) return false

      if (filters.faculty !== 'all' && event.faculty !== filters.faculty) return false
      if (filters.subject !== 'all' && event.subject !== filters.subject) return false
      if (filters.status !== 'all' && event.status !== filters.status) return false
      if (filters.sessionType !== 'all' && event.sessionType !== filters.sessionType) return false
      if (filters.classroom !== 'all' && event.classroom !== filters.classroom) return false

      if (q) {
        const hay = [
          event.className,
          event.subject,
          event.faculty,
          event.center,
          event.classroom,
          event.sessionTypeLabel,
          event.status,
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [allEvents, filters, headerCenter])

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleExtraCenter = useCallback((center) => {
    setFilters((prev) => {
      const has = prev.extraCenters.includes(center)
      return {
        ...prev,
        extraCenters: has
          ? prev.extraCenters.filter((c) => c !== center)
          : [...prev.extraCenters, center],
      }
    })
  }, [])

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return (
      filters.search !== '' ||
      filters.faculty !== 'all' ||
      filters.subject !== 'all' ||
      filters.status !== 'all' ||
      filters.sessionType !== 'all' ||
      filters.classroom !== 'all' ||
      filters.extraCenters.length > 0
    )
  }, [filters])

  return {
    filters,
    setFilter,
    toggleExtraCenter,
    resetFilters,
    hasActiveFilters,
    allEvents,
    filteredEvents,
    facultyOptions,
    subjectOptions,
    statusOptions,
    classroomOptions,
    sessionTypeOptions: [
      { value: 'all', label: 'All types' },
      { value: CALENDAR_SESSION_TYPES.LIVE_SESSION, label: 'Live Session' },
      { value: CALENDAR_SESSION_TYPES.SCHEDULED_CLASS, label: 'Scheduled Class' },
      { value: CALENDAR_SESSION_TYPES.RECORDED_CLASS, label: 'Recorded Class' },
    ],
  }
}
