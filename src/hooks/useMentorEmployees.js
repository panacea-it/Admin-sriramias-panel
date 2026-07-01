import { useEffect, useState } from 'react'
import { fetchMentorsDropdown } from '../api/batchesAPI'
import { mapMentorDropdownRow } from '../utils/mentorEmployees'
import { isMongoObjectId } from '../utils/facultySubjectHelpers'

const LOAD_ERROR = 'Unable to load mentors'

/** Batch mentor dropdown — loads mentors for the selected course via POST mentors/dropdown. */
export function useMentorEmployees({ enabled = false, courseId = '' } = {}) {
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const resolvedCourseId = String(courseId || '').trim()
  const shouldFetch = Boolean(enabled && isMongoObjectId(resolvedCourseId))

  useEffect(() => {
    if (!shouldFetch) {
      setOptions([])
      setError(null)
      setLoading(false)
      return undefined
    }

    const ac = new AbortController()
    let active = true
    setLoading(true)
    setError(null)
    setOptions([])

    ;(async () => {
      try {
        const rows = await fetchMentorsDropdown({
          courseId: resolvedCourseId,
          signal: ac.signal,
        })

        if (!active) return

        if (import.meta.env.DEV) {
          console.log('[batch mentor dropdown] API rows', rows)
        }

        setOptions(
          rows
            .map(mapMentorDropdownRow)
            .filter(Boolean)
            .sort((a, b) => a.label.localeCompare(b.label)),
        )
        setError(null)
      } catch (err) {
        if (!active) return
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        setOptions([])
        setError(err?.message || LOAD_ERROR)
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => {
      active = false
      ac.abort()
    }
  }, [shouldFetch, resolvedCourseId])

  return { options, loading, error }
}
