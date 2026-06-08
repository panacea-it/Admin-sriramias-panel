import { useEffect, useState } from 'react'
import { getFacultySubjectById } from '../api/facultySubjectsAPI'
import { mapApiFacultySubjectToRow } from '../utils/facultySubjectHelpers'
import { syncSingleFacultySubjectToLocal } from '../utils/facultySubjectSync'
import { getApiErrorMessage } from '../utils/apiError'

/**
 * Loads a single faculty subject from GET /api/faculty-subjects/:id.
 * Optionally syncs into local academics storage for legacy content/live-class flows.
 */
export function useFacultySubjectDetail(facultySubjectId, { enabled = true, syncLocal = true } = {}) {
  const [subject, setSubject] = useState(null)
  const [loading, setLoading] = useState(Boolean(enabled && facultySubjectId))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!enabled || !facultySubjectId) {
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getFacultySubjectById(facultySubjectId, {
          signal: controller.signal,
        })
        const row = mapApiFacultySubjectToRow(data)
        if (cancelled) return
        if (!row) {
          setSubject(null)
          setError('Subject not found')
          return
        }
        if (syncLocal) syncSingleFacultySubjectToLocal(data)
        setSubject(row)
      } catch (err) {
        if (cancelled || err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
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
