import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from '@/utils/toast'
import { getApiErrorMessage } from '../utils/apiError'
import { useDebouncedValue } from './useDebouncedValue'
import {
  clearOmrExamsListCache,
  getOmrExams,
} from '../services/omrService'
import {
  mapOmrStatusFilterToApi,
  normalizeOmrExamsListResponse,
  sortOmrExams,
} from '../utils/omrApiHelpers'

function isRateLimited(error) {
  if (error?.response?.status === 429) return true
  const message = getApiErrorMessage(error, '').toLowerCase()
  return message.includes('too many requests')
}

function buildListParams({ debouncedSearch, statusFilter }) {
  const params = { search: debouncedSearch.trim() }
  const apiStatus = mapOmrStatusFilterToApi(statusFilter)
  if (apiStatus) params.status = apiStatus
  return params
}

export function useOmrManagement() {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortDirection, setSortDirection] = useState('desc')
  const debouncedSearch = useDebouncedValue(search, 500)
  const lastErrorToastAt = useRef(0)

  const loadExams = useCallback(
    async ({ bypassCache = false, ignoreFlag } = {}) => {
      const params = buildListParams({ debouncedSearch, statusFilter })

      setLoading(true)
      setError(null)
      try {
        const data = await getOmrExams(params, { bypassCache })
        if (ignoreFlag?.()) return
        setExams(normalizeOmrExamsListResponse(data))
      } catch (err) {
        if (ignoreFlag?.()) return
        if (import.meta.env.DEV) console.error(err)
        const message = getApiErrorMessage(err, 'Failed to load OMR exams')
        setError(message)
        if (!isRateLimited(err)) {
          const now = Date.now()
          if (now - lastErrorToastAt.current > 4000) {
            lastErrorToastAt.current = now
            toast.error(message)
          }
          setExams([])
        }
      } finally {
        if (!ignoreFlag?.()) setLoading(false)
      }
    },
    [debouncedSearch, statusFilter],
  )

  useEffect(() => {
    let ignore = false
    loadExams({ ignoreFlag: () => ignore })
    return () => {
      ignore = true
    }
  }, [loadExams])

  const refreshExams = useCallback(async () => {
    clearOmrExamsListCache()
    await loadExams({ bypassCache: true })
  }, [loadExams])

  const retryLoad = useCallback(() => {
    refreshExams()
  }, [refreshExams])

  const patchExamLocally = useCallback((examId, patch) => {
    setExams((prev) =>
      prev.map((row) => (String(row.id) === String(examId) ? { ...row, ...patch } : row)),
    )
  }, [])

  const removeExamLocally = useCallback((examId) => {
    setExams((prev) => prev.filter((row) => String(row.id) !== String(examId)))
  }, [])

  const toggleSort = useCallback((key) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDirection((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'))
        return prevKey
      }
      setSortDirection('asc')
      return key
    })
  }, [])

  const sortedExams = useMemo(
    () => sortOmrExams(exams, sortKey, sortDirection),
    [exams, sortKey, sortDirection],
  )

  return {
    exams: sortedExams,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortKey,
    sortDirection,
    toggleSort,
    refreshExams,
    retryLoad,
    patchExamLocally,
    removeExamLocally,
  }
}
