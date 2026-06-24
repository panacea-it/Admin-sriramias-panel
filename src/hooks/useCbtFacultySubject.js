import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCbtFacultySubjects } from '../api/cbtManagementAPI'
import { getCbtFacultyBySubjectId } from '../utils/cbtTestSeriesHierarchy'
import { useCbtTestSeriesHierarchy } from './useCbtTestSeriesHierarchy'

/**
 * Resolves a CBT faculty-subject row for detail routes.
 * Uses the shared hierarchy cache first, then fetches the list API for deep links.
 */
export function useCbtFacultySubject(subjectId) {
  const { mappingRows, loading: hierarchyLoading } = useCbtTestSeriesHierarchy()
  const [resolvedFaculty, setResolvedFaculty] = useState(null)
  const [resolving, setResolving] = useState(false)

  const fromHierarchy = useMemo(
    () => mappingRows.find((r) => String(r.subjectId) === String(subjectId)),
    [mappingRows, subjectId],
  )

  const resolveFromApi = useCallback(async (signal) => {
    if (!subjectId) {
      setResolvedFaculty(null)
      return
    }
    setResolving(true)
    try {
      const rows = await fetchCbtFacultySubjects({ limit: 500 }, signal)
      const match = rows.find((r) => String(r.subjectId) === String(subjectId))
      setResolvedFaculty(match || getCbtFacultyBySubjectId(subjectId) || null)
    } catch (error) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
      setResolvedFaculty(getCbtFacultyBySubjectId(subjectId) || null)
    } finally {
      setResolving(false)
    }
  }, [subjectId])

  useEffect(() => {
    if (fromHierarchy) {
      setResolvedFaculty(fromHierarchy)
      return undefined
    }
    if (!subjectId || hierarchyLoading) return undefined
    const controller = new AbortController()
    resolveFromApi(controller.signal)
    return () => controller.abort()
  }, [fromHierarchy, hierarchyLoading, subjectId, resolveFromApi])

  const faculty = fromHierarchy || resolvedFaculty
  const loading = hierarchyLoading || resolving

  return { faculty, loading }
}
