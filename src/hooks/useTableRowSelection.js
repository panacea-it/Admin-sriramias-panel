import { useCallback, useMemo, useState } from 'react'

/**
 * Row selection state for PaginatedFigmaTable `selection` prop.
 */
export function useTableRowSelection(getRowId = (row) => row.id) {
  const [selectedIds, setSelectedIds] = useState([])

  const onToggle = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const onTogglePage = useCallback((pageIds, select) => {
    setSelectedIds((prev) => {
      if (select) {
        const merged = new Set([...prev, ...pageIds])
        return [...merged]
      }
      return prev.filter((id) => !pageIds.includes(id))
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds([]), [])

  const selection = useMemo(
    () => ({
      selectedIds,
      onToggle,
      onTogglePage,
      getRowId,
    }),
    [selectedIds, onToggle, onTogglePage, getRowId],
  )

  return { selectedIds, selection, clearSelection }
}
