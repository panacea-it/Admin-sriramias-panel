import { useCallback, useEffect, useRef, useState } from 'react'
import { freeResourceService } from '../services/freeResourceService'
import {
  getPreviousYearPaperApiErrorMessage,
  normalizePreviousYearPapersListResponse,
} from '../utils/freeResourceApiHelpers'

export function usePreviousYearPapersData({ enabled = true, search = '', page = 1, limit = 10 } = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const abortRef = useRef(null)
  const requestIdRef = useRef(0)

  const loadPreviousYearPapers = useCallback(
    async ({ searchQuery, pageNo = page, pageLimit = limit } = {}) => {
      if (!enabled) return

      const query = searchQuery ?? search
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setLoading(true)
      setError(null)

      try {
        const data = await freeResourceService.getPreviousYearPapers(
          {
            page: pageNo,
            limit: pageLimit,
            search: String(query || '').trim(),
          },
          { signal: controller.signal },
        )

        if (controller.signal.aborted || requestIdRef.current !== requestId) return

        const normalized = normalizePreviousYearPapersListResponse(data, {
          page: pageNo,
          limit: pageLimit,
        })
        setItems(normalized.items)
        setPagination({
          page: normalized.page,
          total: normalized.total,
          totalPages: normalized.totalPages,
        })
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        if (requestIdRef.current !== requestId) return

        const message = getPreviousYearPaperApiErrorMessage(
          err,
          'Failed to load previous year papers.',
        )
        setError(message)
        setItems([])
      } finally {
        if (requestIdRef.current === requestId) {
          setLoading(false)
        }
      }
    },
    [enabled, search, page, limit],
  )

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort()
      setItems([])
      setLoading(false)
      return undefined
    }

    const timer = setTimeout(() => {
      loadPreviousYearPapers({ searchQuery: search })
    }, 300)

    return () => {
      clearTimeout(timer)
      abortRef.current?.abort()
    }
  }, [enabled, search, loadPreviousYearPapers])

  const refresh = useCallback(() => {
    loadPreviousYearPapers({ searchQuery: search, pageNo: page, pageLimit: limit })
  }, [loadPreviousYearPapers, search, page, limit])

  return {
    items,
    loading,
    error,
    pagination,
    refresh,
    loadPreviousYearPapers,
  }
}
