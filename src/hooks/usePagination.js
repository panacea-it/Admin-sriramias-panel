import { useCallback, useEffect, useMemo, useState } from 'react'

const DEFAULT_PAGE_SIZE = 10

/**
 * Client-side pagination — ready to swap slice logic for API offset/limit later.
 */
export function usePagination(items, { initialPageSize = DEFAULT_PAGE_SIZE, resetDeps = [] } = {}) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const resetKey = JSON.stringify(resetDeps)

  useEffect(() => {
    setPage(1)
  }, [resetKey, items.length])

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)

  const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  )

  const goToPage = useCallback(
    (next) => {
      const value = typeof next === 'function' ? next(safePage) : next
      setPage(Math.min(Math.max(1, value), totalPages))
    },
    [safePage, totalPages],
  )

  const changePageSize = useCallback((size) => {
    setPageSize(Number(size))
    setPage(1)
  }, [])

  return {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    paginatedItems,
    setPage: goToPage,
    setPageSize: changePageSize,
    isFirstPage: safePage <= 1,
    isLastPage: safePage >= totalPages,
  }
}
