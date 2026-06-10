import { useMemo } from 'react'
import { getCourseCountForSubject } from '../utils/liveClassInheritance'

export function useLiveClassesList(lessons, filters) {
  const { search, lessonType, status, subjectFilter, sort } = filters

  return useMemo(() => {
    let rows = [...lessons]
    const q = search.trim().toLowerCase()

    if (q) {
      rows = rows.filter(
        (r) =>
          r.lessonName?.toLowerCase().includes(q) ||
          r.teacher?.toLowerCase().includes(q) ||
          r.subjectName?.toLowerCase().includes(q) ||
          r.topic?.toLowerCase().includes(q),
      )
    }
    if (lessonType && lessonType !== 'all') {
      rows = rows.filter((r) => r.lessonType === lessonType)
    }
    if (status && status !== 'all') {
      rows = rows.filter((r) => r.status === status)
    }
    if (subjectFilter && subjectFilter !== 'all') {
      rows = rows.filter((r) => r.subjectId === subjectFilter)
    }

    rows.sort((a, b) => {
      switch (sort) {
        case 'date-asc':
          return (a.scheduledDate || '').localeCompare(b.scheduledDate || '')
        case 'name-asc':
          return (a.lessonName || '').localeCompare(b.lessonName || '')
        case 'name-desc':
          return (b.lessonName || '').localeCompare(a.lessonName || '')
        case 'date-desc':
        default:
          return (b.scheduledDate || '').localeCompare(a.scheduledDate || '')
      }
    })

    return rows.map((r) => ({
      ...r,
      courseCount: getCourseCountForSubject(r.subjectId),
      scheduledDisplay: r.scheduledDate
        ? `${r.scheduledDate}${r.scheduledTime ? ` · ${r.scheduledTime}` : ''}`
        : '—',
    }))
  }, [lessons, search, lessonType, status, subjectFilter, sort])
}
