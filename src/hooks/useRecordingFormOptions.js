import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getAllTeachersDropdown,
  getRecordingTopicsDropdown,
  getRecordingsCreateForm,
} from '../api/recordingsAPI'
import { getCentersDropdown, getBatchDropdown } from '../services/recording.service'
import { getFacultySubjectId } from '../utils/sessionStorage'
import { normalizeBatchesDropdownResponse, normalizeCentersDropdownResponse } from '../utils/liveClassHelpers'
import {
  normalizeRecordingsCreateFormResponse,
  normalizeTeachersDropdownResponse,
  normalizeTopicsDropdownResponse,
  resolveBatchMongoId,
} from '../utils/recordingHelpers'
import { withRateLimitRetry } from '../utils/rateLimitRetry'
import { resolveCenterOptionId } from '../utils/recordingHelpers'

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
  const [topics, setTopics] = useState([])
  const [loadingCreateForm, setLoadingCreateForm] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)
  const [loadingCenters, setLoadingCenters] = useState(false)
  const [centersError, setCentersError] = useState(null)
  const [batches, setBatches] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(false)
  const [batchesError, setBatchesError] = useState(null)
  const [batchesFetched, setBatchesFetched] = useState(false)
  const [batchReloadToken, setBatchReloadToken] = useState(0)
  const [loadingTopics, setLoadingTopics] = useState(false)

  const topicsRequestRef = useRef(0)
  const createFormRequestRef = useRef(0)
  const baseLoadedRef = useRef(false)
  const centersRef = useRef([])

  centersRef.current = centers

  const resolvedSubjectId = String(facultySubjectId || getFacultySubjectId() || '').trim()
  const batchesEmpty =
    Boolean(centerId) &&
    Boolean(resolvedSubjectId) &&
    batchesFetched &&
    !loadingBatches &&
    !batchesError &&
    batches.length === 0

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
    setCentersError(null)
    try {
      const data = await withRateLimitRetry(() => getCentersDropdown({ signal }))
      setCenters(normalizeCentersDropdownResponse(data))
    } catch {
      if (!signal?.aborted) {
        setCenters([])
        setCentersError('Unable to load centers')
      }
    } finally {
      if (!signal?.aborted) setLoadingCenters(false)
    }
  }, [])

  const loadTopics = useCallback(
    async (selectedBatchId, subjectId, batchRows, { signal } = {}) => {
      const requestId = ++topicsRequestRef.current
      const mongoBatchId = resolveBatchMongoId(selectedBatchId, batchRows)
      const businessBatchId = batchRows.find(
        (b) =>
          String(b.id) === String(selectedBatchId) ||
          String(b.batchId) === String(selectedBatchId),
      )?.batchId

      if (!mongoBatchId || !subjectId) {
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

  const loadBatchesForCenter = useCallback(
    async (centerIdValue, { signal } = {}) => {
      const selectedCenterId =
        resolveCenterOptionId(centerIdValue, centersRef.current) ||
        String(centerIdValue || '').trim()
      const facultySubjectIdForApi = String(getFacultySubjectId() || resolvedSubjectId || '').trim()

      if (!selectedCenterId || !facultySubjectIdForApi) {
        setBatches([])
        setBatchesFetched(false)
        setBatchesError(null)
        setLoadingBatches(false)
        return
      }

      setBatches([])
      setBatchesFetched(false)
      setLoadingBatches(true)
      setBatchesError(null)

      try {
        const data = await withRateLimitRetry(() =>
          getBatchDropdown({
            facultySubjectId: facultySubjectIdForApi,
            centerId: selectedCenterId,
            signal,
          }),
        )
        if (signal?.aborted) return
        setBatches(normalizeBatchesDropdownResponse(data))
        setBatchesFetched(true)
      } catch (error) {
        if (signal?.aborted || error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') {
          return
        }
        setBatches([])
        setBatchesError('Unable to load batches')
        setBatchesFetched(true)
      } finally {
        if (!signal?.aborted) {
          setLoadingBatches(false)
        }
      }
    },
    [resolvedSubjectId],
  )

  useEffect(() => {
    if (!enabled || !formOpen) {
      setBatches([])
      setLoadingBatches(false)
      setBatchesError(null)
      setBatchesFetched(false)
      return undefined
    }

    const centerIdValue = String(centerId || '').trim()
    if (!centerIdValue) {
      setBatches([])
      setLoadingBatches(false)
      setBatchesError(null)
      setBatchesFetched(false)
      return undefined
    }

    const controller = new AbortController()
    loadBatchesForCenter(centerIdValue, { signal: controller.signal })
    return () => controller.abort()
  }, [enabled, formOpen, centerId, batchReloadToken, loadBatchesForCenter])

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

    const facultySubjectIdForApi = String(getFacultySubjectId() || resolvedSubjectId || '').trim()
    const controller = new AbortController()
    loadTopics(batchId, facultySubjectIdForApi, batches, { signal: controller.signal })
    return () => {
      controller.abort()
      topicsRequestRef.current += 1
    }
  }, [enabled, formOpen, batchId, resolvedSubjectId, batches, loadTopics])

  const reloadBatches = useCallback(() => {
    setBatchReloadToken((token) => token + 1)
  }, [])

  return {
    createFormDefaults,
    teachers,
    centers,
    batches,
    topics,
    loadingCreateForm,
    loadingTeachers,
    loadingCenters,
    centersError,
    loadingBatches,
    loadingTopics,
    batchesError,
    batchesEmpty,
    batchesFetched,
    reloadCreateForm: loadCreateFormDefaults,
    reloadTeachers: loadTeachers,
    reloadCenters: loadCenters,
    reloadBatches,
    reloadTopics: () => loadTopics(batchId, resolvedSubjectId, batches),
  }
}
