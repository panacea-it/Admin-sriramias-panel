import { useCallback, useEffect, useRef, useState } from 'react'
import { postBatchesDropdown } from '../api/batchesAPI'
import {
  getCentersDropdown,
  getClassroomsDropdown,
} from '../api/liveClassesHttpAPI'
import { isMongoObjectId } from '../utils/facultySubjectHelpers'
import {
  normalizeBatchesDropdownResponse,
  normalizeCentersDropdownResponse,
  normalizeClassroomsDropdownResponse,
} from '../utils/liveClassHelpers'

export function useLiveClassFormOptions({
  centerId,
  facultySubjectId,
  enabled = true,
} = {}) {
  const [batches, setBatches] = useState([])
  const [centers, setCenters] = useState([])
  const [classrooms, setClassrooms] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [loadingClassrooms, setLoadingClassrooms] = useState(false)
  const batchesRequestRef = useRef(0)

  const loadBatches = useCallback(
    async (selectedCenterId, subjectId, { signal } = {}) => {
      const requestId = ++batchesRequestRef.current
      if (!selectedCenterId || !subjectId || !isMongoObjectId(subjectId)) {
        if (requestId === batchesRequestRef.current) setBatches([])
        return
      }

      setLoadingBatches(true)
      try {
        const data = await postBatchesDropdown({
          facultySubjectId: subjectId,
          centerId: selectedCenterId,
          signal,
        })
        if (requestId !== batchesRequestRef.current) return
        setBatches(normalizeBatchesDropdownResponse(data))
      } catch {
        if (requestId !== batchesRequestRef.current) return
        setBatches([])
      } finally {
        if (requestId === batchesRequestRef.current) {
          setLoadingBatches(false)
        }
      }
    },
    [],
  )

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
    if (!enabled) {
      setBatches([])
      setLoadingBatches(false)
      return undefined
    }

    const controller = new AbortController()
    loadBatches(centerId, facultySubjectId, { signal: controller.signal })
    return () => {
      controller.abort()
      batchesRequestRef.current += 1
    }
  }, [enabled, centerId, facultySubjectId, loadBatches])

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
    reloadBatches: () => loadBatches(centerId, facultySubjectId),
    reloadClassrooms: () => loadClassrooms(centerId),
  }
}
