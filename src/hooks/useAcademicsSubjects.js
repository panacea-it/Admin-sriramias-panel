import { useCallback, useEffect, useState } from 'react'
import {
  loadAcademicsSubjects,
  saveAcademicsSubjects,
} from '../utils/academicsSubjectsStorage'

export function useAcademicsSubjects() {
  const [subjects, setSubjects] = useState(() => loadAcademicsSubjects())

  const persist = useCallback((next) => {
    setSubjects(next)
    saveAcademicsSubjects(next)
  }, [])

  useEffect(() => {
    const refresh = () => setSubjects(loadAcademicsSubjects())
    window.addEventListener('academics-subjects-updated', refresh)
    return () => window.removeEventListener('academics-subjects-updated', refresh)
  }, [])

  const getSubjectById = useCallback(
    (id) => subjects.find((s) => String(s.id) === String(id)),
    [subjects],
  )

  const upsertSubject = useCallback(
    (row) => {
      const rowId = String(row.id)
      persist(
        subjects.some((s) => String(s.id) === rowId)
          ? subjects.map((s) => (String(s.id) === rowId ? row : s))
          : [...subjects, row],
      )
    },
    [persist, subjects],
  )

  const deleteSubject = useCallback(
    (id) => {
      const targetId = String(id)
      persist(subjects.filter((s) => String(s.id) !== targetId))
    },
    [persist, subjects],
  )

  const upsertLiveClass = useCallback(
    (subjectId, liveClass) => {
      persist(
        subjects.map((s) => {
          if (s.id !== subjectId) return s
          const list = s.liveClasses || []
          const exists = list.some((lc) => lc.id === liveClass.id)
          const liveClasses = exists
            ? list.map((lc) => (lc.id === liveClass.id ? liveClass : lc))
            : [...list, liveClass]
          return { ...s, liveClasses }
        }),
      )
    },
    [persist, subjects],
  )

  const deleteLiveClass = useCallback(
    (subjectId, liveClassId) => {
      persist(
        subjects.map((s) => {
          if (s.id !== subjectId) return s
          return {
            ...s,
            liveClasses: (s.liveClasses || []).filter((lc) => lc.id !== liveClassId),
          }
        }),
      )
    },
    [persist, subjects],
  )

  const upsertLiveClassesBatch = useCallback(
    (subjectId, rows, { removeSeriesId, scope, fromDate } = {}) => {
      persist(
        subjects.map((s) => {
          if (s.id !== subjectId) return s
          let list = [...(s.liveClasses || [])]
          if (removeSeriesId) {
            if (scope === 'series') {
              list = list.filter((lc) => lc.recurrenceSeriesId !== removeSeriesId)
            } else if (scope === 'future' && fromDate) {
              list = list.filter(
                (lc) =>
                  lc.recurrenceSeriesId !== removeSeriesId ||
                  !lc.date ||
                  lc.date < fromDate,
              )
            }
          }
          for (const row of rows) {
            const idx = list.findIndex((lc) => lc.id === row.id)
            if (idx >= 0) list[idx] = row
            else list.push(row)
          }
          return { ...s, liveClasses: list }
        }),
      )
    },
    [persist, subjects],
  )

  const deleteLiveClassWithScope = useCallback(
    (subjectId, liveClass, scope = 'this') => {
      const seriesId = liveClass?.recurrenceSeriesId
      const parentId = String(subjectId)
      const liveClassId = String(liveClass?.id)
      persist(
        subjects.map((s) => {
          if (String(s.id) !== parentId) return s
          let list = s.liveClasses || []
          if (!seriesId || scope === 'this') {
            list = list.filter((lc) => String(lc.id) !== liveClassId)
          } else if (scope === 'series') {
            list = list.filter((lc) => lc.recurrenceSeriesId !== seriesId)
          } else if (scope === 'future' && liveClass.date) {
            list = list.filter(
              (lc) =>
                lc.recurrenceSeriesId !== seriesId ||
                !lc.date ||
                lc.date < liveClass.date,
            )
          }
          return { ...s, liveClasses: list }
        }),
      )
    },
    [persist, subjects],
  )

  return {
    subjects,
    setSubjects: persist,
    getSubjectById,
    upsertSubject,
    deleteSubject,
    upsertLiveClass,
    deleteLiveClass,
    upsertLiveClassesBatch,
    deleteLiveClassWithScope,
  }
}
