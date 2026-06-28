import { useCallback, useEffect, useState } from 'react'
import {
  getCentersDropdown,
  getClassroomsDropdown,
} from '../api/liveClassesHttpAPI'
import {
  normalizeCentersDropdownResponse,
  normalizeClassroomsDropdownResponse,
} from '../utils/liveClassHelpers'
import { useFacultySubjectBatchesDropdown } from './useFacultySubjectBatchesDropdown'

export function useLiveClassFormOptions({
  centerId,
  facultySubjectId,
  enabled = true,
} = {}) {
  const [centers, setCenters] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [loadingClassrooms, setLoadingClassrooms] = useState(false)

  const resolvedSubjectId = String(facultySubjectId || '').trim()

  const {
    batches,
    loading: loadingBatches,
    error: batchesError,
    isEmpty: batchesEmpty,
    refetch: reloadBatches,
  } = useFacultySubjectBatchesDropdown({
    facultySubjectId: resolvedSubjectId,
    centerId,
    centerOptions: centers,
    enabled: enabled && Boolean(resolvedSubjectId),
    requireCenter: true,
  })

  const loadCenters = useCallback(async ({ signal } = {}) => {
    setLoadingCenters(true)
    try {
      const data = await getCentersDropdown({ signal })
      setCenters(normalizeCentersDropdownResponse(data))
    } catch {
      if (!signal?.aborted) setCenters([])
    } finally {
      if (!signal?.aborted) setLoadingCenters(false)
    }
  }, [])

  const loadClassrooms = useCallback(async (selectedCenterId, { signal } = {}) => {
    if (!selectedCenterId) {
      setClassrooms([])
      return
    }
    setLoadingClassrooms(true)
    try {
      const data = await getClassroomsDropdown(selectedCenterId, { signal })
      setClassrooms(normalizeClassroomsDropdownResponse(data))
    } catch {
      if (!signal?.aborted) setClassrooms([])
    } finally {
      if (!signal?.aborted) setLoadingClassrooms(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return undefined
    const controller = new AbortController()
    loadCenters({ signal: controller.signal })
    return () => controller.abort()
  }, [enabled, loadCenters])

  useEffect(() => {
    if (!enabled) return undefined
    const controller = new AbortController()
    loadClassrooms(centerId, { signal: controller.signal })
    return () => controller.abort()
  }, [enabled, centerId, loadClassrooms])

  return {
    batches,
    centers,
    classrooms,
    loadingBatches,
    loadingCenters,
    loadingClassrooms,
    batchesError,
    batchesEmpty,
    reloadBatches,
    reloadClassrooms: () => loadClassrooms(centerId),
  }
}
