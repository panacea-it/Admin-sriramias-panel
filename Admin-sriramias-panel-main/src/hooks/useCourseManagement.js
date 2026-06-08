import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { getCourses } from '../services/courseService'
import { normalizeCoursesListResponse } from '../utils/courseApiHelpers'

export function useCourseManagement() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getCourses({ page: 1, limit: 500 })
      const normalized = normalizeCoursesListResponse(data, { page: 1, limit: 500 })
      setCourses(normalized.items)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to load courses'))
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  const patchCourseLocally = useCallback((id, patch) => {
    setCourses((prev) =>
      prev.map((row) => (String(row.id) === String(id) ? { ...row, ...patch } : row)),
    )
  }, [])

  const removeCourseLocally = useCallback((id) => {
    setCourses((prev) => prev.filter((row) => String(row.id) !== String(id)))
  }, [])

  return {
    courses,
    loading,
    refreshCourses: fetchCourses,
    patchCourseLocally,
    removeCourseLocally,
  }
}
