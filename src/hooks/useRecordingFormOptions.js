import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getCentersDropdown,
  getAllTeachersDropdown,
  getRecordingTopicsDropdown,
  getRecordingsCreateForm,
  postBatchesDropdown,
} from '../api/recordingsAPI'
import { isMongoObjectId } from '../utils/facultySubjectHelpers'
import {
  normalizeCentersDropdownResponse,
  normalizeBatchesDropdownResponse,
} from '../utils/liveClassHelpers'
import {
  normalizeRecordingsCreateFormResponse,
  normalizeTeachersDropdownResponse,
  normalizeTopicsDropdownResponse,
  resolveBatchMongoId,
  resolveCenterOptionId,
} from '../utils/recordingHelpers'
import { withRateLimitRetry } from '../utils/rateLimitRetry'

export function useRecordingFormOptions({
  facultySubjectId,
  centerId,
  batchId,
  enabled = true,
  formOpen = false,
  loadCreateForm = false,
} = {}) {
  const [createFormDefaults, setCreateFormDefaults] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [centers, setCenters] = useState([])
  const [batches, setBatches] = useState([])
  const [topics, setTopics] = useState([])
  const [loadingCreateForm, setLoadingCreateForm] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)

  const batchesRequestRef = useRef(0)
  const topicsRequestRef = useRef(0)
  const createFormRequestRef = useRef(0)
  const baseLoadedRef = useRef(false)

  const resolvedSubjectId = isMongoObjectId(facultySubjectId)
    ? String(facultySubjectId)
    : ''

  const resolvedCenterId = resolveCenterOptionId(centerId, centers)

  const loadCreateFormDefaults = useCallback(async ({ signal } = {}) => {
    if (!resolvedSubjectId) return null
    const requestId = ++createFormRequestRef.current
    setLoadingCreateForm(true)
    try {
      const data = await withRateLimitRetry(() =>
        getRecordingsCreateForm(resolvedSubjectId, { signal }),
      )
      if (requestId !== createFormRequestRef.current) return null
      const defaults = normalizeRecordingsCreateFormResponse(data)
      setCreateFormDefaults(defaults)
      return defaults
    } catch {
      if (requestId !== createFormRequestRef.current) return null
      setCreateFormDefaults(null)
      return null
    } finally {
      if (requestId === createFormRequestRef.current) {
        setLoadingCreateForm(false)
      }
    }
  }, [resolvedSubjectId])

  const loadTeachers = useCallback(async ({ signal } = {}) => {
    setLoadingTeachers(true)
    try {
      const data = await withRateLimitRetry(() => getAllTeachersDropdown({ signal }))
      setTeachers(normalizeTeachersDropdownResponse(data))
    } catch {
      if (!signal?.aborted) setTeachers([])
    } finally {
      if (!signal?.aborted) setLoadingTeachers(false)
    }
  }, [])

  const loadCenters = useCallback(async ({ signal } = {}) => {
    setLoadingCenters(true)
    try {
      const data = await withRateLimitRetry(() => getCentersDropdown({ signal }))
      setCenters(normalizeCentersDropdownResponse(data))
    } catch {
      if (!signal?.aborted) setCenters([])
    } finally {
      if (!signal?.aborted) setLoadingCenters(false)
    }
  }, [])

  const loadBatches = useCallback(
    async (selectedCenterId, subjectId, { signal } = {}) => {
      const requestId = ++batchesRequestRef.current
      const resolvedCenter = resolveCenterOptionId(selectedCenterId, centers)

      if (!resolvedCenter || !subjectId || !isMongoObjectId(subjectId)) {
        if (requestId === batchesRequestRef.current) setBatches([])
        return
      }

      setLoadingBatches(true)
      try {
        const data = await withRateLimitRetry(() =>
          postBatchesDropdown({
            facultySubjectId: subjectId,
            centerId: resolvedCenter,
            signal,
          }),
        )
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
    [centers],
  )

  const loadTopics = useCallback(
    async (selectedBatchId, subjectId, batchRows, { signal } = {}) => {
      const requestId = ++topicsRequestRef.current
      const mongoBatchId = resolveBatchMongoId(selectedBatchId, batchRows)
      const businessBatchId = batchRows.find(
        (b) => String(b.id) === String(selectedBatchId) || String(b.batchId) === String(selectedBatchId),
      )?.batchId

      if (!mongoBatchId || !subjectId || !isMongoObjectId(subjectId)) {
        if (requestId === topicsRequestRef.current) setTopics([])
        return
      }

      setLoadingTopics(true)
      try {
        let data
        try {
          data = await withRateLimitRetry(() =>
            getRecordingTopicsDropdown({
              batchId: mongoBatchId,
              facultySubjectId: subjectId,
              signal,
            }),
          )
        } catch (firstError) {
          if (
            businessBatchId &&
            String(businessBatchId) !== String(mongoBatchId)
          ) {
            data = await withRateLimitRetry(() =>
              getRecordingTopicsDropdown({
                batchId: String(businessBatchId),
                facultySubjectId: subjectId,
                signal,
              }),
            )
          } else {
            throw firstError
          }
        }

        if (requestId !== topicsRequestRef.current) return
        setTopics(normalizeTopicsDropdownResponse(data))
      } catch {
        if (requestId !== topicsRequestRef.current) return
        setTopics([])
      } finally {
        if (requestId === topicsRequestRef.current) {
          setLoadingTopics(false)
        }
      }
    },
    [],
  )

  useEffect(() => {
    if (!enabled || !formOpen) {
      baseLoadedRef.current = false
      return undefined
    }

    if (baseLoadedRef.current) return undefined
    baseLoadedRef.current = true

    const controller = new AbortController()
    loadTeachers({ signal: controller.signal })
    loadCenters({ signal: controller.signal })
    if (loadCreateForm) {
      loadCreateFormDefaults({ signal: controller.signal })
    }
    return () => {
      controller.abort()
      baseLoadedRef.current = false
    }
  }, [
    enabled,
    formOpen,
    loadCreateForm,
    loadTeachers,
    loadCenters,
    loadCreateFormDefaults,
  ])

  useEffect(() => {
    if (!enabled || !formOpen) {
      setBatches([])
      setLoadingBatches(false)
      return undefined
    }

    const controller = new AbortController()
    loadBatches(centerId, resolvedSubjectId, { signal: controller.signal })
    return () => {
      controller.abort()
      batchesRequestRef.current += 1
    }
  }, [enabled, formOpen, centerId, resolvedSubjectId, centers, loadBatches])

  useEffect(() => {
    if (!enabled || !formOpen) {
      setTopics([])
      setLoadingTopics(false)
      return undefined
    }

    if (!batchId) {
      setTopics([])
      return undefined
    }

    const controller = new AbortController()
    loadTopics(batchId, resolvedSubjectId, batches, { signal: controller.signal })
    return () => {
      controller.abort()
      topicsRequestRef.current += 1
    }
  }, [enabled, formOpen, batchId, resolvedSubjectId, batches, loadTopics])

  return {
    createFormDefaults,
    teachers,
    centers,
    batches,
    topics,
    loadingCreateForm,
    loadingTeachers,
    loadingCenters,
    loadingBatches,
    loadingTopics,
    reloadCreateForm: loadCreateFormDefaults,
    reloadTeachers: loadTeachers,
    reloadCenters: loadCenters,
    reloadBatches: () => loadBatches(centerId, resolvedSubjectId),
    reloadTopics: () => loadTopics(batchId, resolvedSubjectId, batches),
  }
}
