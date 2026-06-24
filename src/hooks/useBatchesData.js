import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchBatches } from '../api/batchesAPI'
import {
  enrichBatchRow,
  findBatchRow,
  matchesBatchSearch,
  resolveBatchMongoId,
} from '../utils/batchHelpers'
import { getApiErrorMessage } from '../utils/apiError'

export { findBatchRow, resolveBatchMongoId }

export function useBatchesData({
  enabled = true,
  page = 1,
  limit = 20,
  search = '',
  status = 'all',
} = {}) {
  const [apiBatches, setApiBatches] = useState([])
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    count: 0,
  })
  const [loading, setLoading] = useState(Boolean(enabled))
  const [error, setError] = useState(null)
  const requestIdRef = useRef(0)
  const abortRef = useRef(null)

  const trimmedSearch = String(search || '').trim()

  const loadBatches = useCallback(
    async ({ silent = false, page: pageOverride, limit: limitOverride } = {}) => {
      if (!enabled) return

      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac

      const requestId = ++requestIdRef.current
      if (!silent) setLoading(true)

      try {
        const { rows, meta: listMeta } = await fetchBatches(
          {
            page: pageOverride ?? page,
            limit: limitOverride ?? limit,
            search: trimmedSearch,
            status,
          },
          { signal: ac.signal },
        )

        if (requestId !== requestIdRef.current) return

        let enriched = rows.map((row, i) => enrichBatchRow(row, i))

        if (trimmedSearch) {
          enriched = enriched.filter((row) => matchesBatchSearch(row, trimmedSearch))
        }

        setApiBatches(enriched)
        setMeta(listMeta)
        setError(null)
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        if (requestId !== requestIdRef.current) return

        const statusCode = err?.status ?? err?.response?.status
        let message = getApiErrorMessage(err, 'Failed to load batches')
        if (statusCode === 429) {
          message = 'Too many requests. Please wait a moment and try again.'
        } else if (statusCode === 500) {
          message = 'Server error while loading batches. Please try again.'
        }

        setApiBatches([])
        setMeta({ total: 0, page: 1, limit, totalPages: 1, count: 0 })
        setError(message)
      } finally {
        if (requestId === requestIdRef.current && !silent) setLoading(false)
      }
    },
    [enabled, page, limit, trimmedSearch, status],
  )

  useEffect(() => {
    if (!enabled) return undefined
    void loadBatches()
    return () => {
      abortRef.current?.abort()
    }
  }, [enabled, loadBatches])

  const sourceRows = useMemo(() => apiBatches, [apiBatches])

  const existingCourseIds = useMemo(
    () => apiBatches.map((b) => b.courseId).filter(Boolean),
    [apiBatches],
  )

  return {
    apiBatches,
    sourceRows,
    meta,
    loading,
    error,
    loadBatches,
    existingCourseIds,
  }
}
