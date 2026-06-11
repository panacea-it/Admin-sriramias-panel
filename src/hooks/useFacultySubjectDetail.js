import { useEffect, useState } from 'react'
import { getFacultySubjectById } from '../api/facultySubjectsAPI'
import { mapApiFacultySubjectToRow } from '../utils/facultySubjectHelpers'
import { loadAcademicsSubjects } from '../utils/academicsSubjectsStorage'
import { syncSingleFacultySubjectToLocal } from '../utils/facultySubjectSync'
import { getApiErrorMessage } from '../utils/apiError'

function loadLocalSubjectRow(facultySubjectId) {
  if (!facultySubjectId) return null
  const local = loadAcademicsSubjects().find(
    (row) => String(row.id) === String(facultySubjectId),
  )
  if (!local) return null
  return mapApiFacultySubjectToRow(local) || local
}

/**
 * Loads a single faculty subject from GET /api/faculty-subjects/:id.
 * Optionally syncs into local academics storage for legacy content/live-class flows.
 */
export function useFacultySubjectDetail(facultySubjectId, { enabled = true, syncLocal = true } = {}) {
  const [subject, setSubject] = useState(() => loadLocalSubjectRow(facultySubjectId))
  const [loading, setLoading] = useState(Boolean(enabled && facultySubjectId && !subject))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !facultySubjectId) {
      setLoading(false)
      return undefined
    }

    const localRow = loadLocalSubjectRow(facultySubjectId)
    if (localRow) setSubject(localRow)

    const controller = new AbortController()
    let cancelled = false

    ;(async () => {
      setLoading(!localRow)
      setError(null)
      try {
        const data = await getFacultySubjectById(facultySubjectId, {
          signal: controller.signal,
        })
        const row = mapApiFacultySubjectToRow(data)
        if (cancelled) return
        if (!row) {
          if (!localRow) {
            setSubject(null)
            setError('Subject not found')
          }
          return
        }
        if (syncLocal) syncSingleFacultySubjectToLocal(data)
        setSubject(row)
      } catch (err) {
        if (cancelled || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        if (localRow) {
          setSubject(localRow)
          setError(null)
          return
        }
        setSubject(null)
        setError(getApiErrorMessage(err, 'Failed to load subject details'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [enabled, facultySubjectId, syncLocal])

  return { subject, loading, error }
}
