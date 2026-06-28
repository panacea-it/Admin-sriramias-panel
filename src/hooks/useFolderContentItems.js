import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchFolderContentByCategory } from '../utils/folderContentApi'
import { mapCategoryTypeToApi } from '../utils/facultySubjectFolderHelpers'
import { normalizeFolderContentResponse } from '../utils/folderContentHelpers'

/**
 * Loads folder content items from GET /api/folders/content (all delivery categories).
 */
export function useFolderContentItems({
  facultySubjectId,
  categoryType,
  folderId,
  page = 1,
  limit = 50,
  enabled = true,
} = {}) {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit, totalPages: 1 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const requestRef = useRef(0)

  const apiCategory = mapCategoryTypeToApi(categoryType)
  const canLoad =
    enabled && Boolean(facultySubjectId) && Boolean(folderId) && Boolean(apiCategory)

  const load = useCallback(
    async ({ bypassCache = false, signal } = {}) => {
      if (!canLoad) {
        setItems([])
        setError(null)
        return []
      }

      const requestId = ++requestRef.current
      setLoading(true)
      setError(null)

      try {
        const data = await fetchFolderContentByCategory(
          {
            facultySubjectId: String(facultySubjectId),
            category: apiCategory,
            folderId: String(folderId),
            page,
            limit,
          },
          { signal, bypassCache },
        )
        if (requestId !== requestRef.current) return []

        const normalized = normalizeFolderContentResponse(data, apiCategory)
        setItems(normalized.items)
        setMeta({
          total: normalized.total,
          page: normalized.page,
          limit: normalized.limit,
          totalPages: normalized.totalPages,
        })
        return normalized.items
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return []
        if (requestId !== requestRef.current) return []
        setItems([])
        setError(err?.message || 'Failed to load folder content')
        return []
      } finally {
        if (requestId === requestRef.current) setLoading(false)
      }
    },
    [canLoad, facultySubjectId, folderId, apiCategory, page, limit],
  )

  useEffect(() => {
    if (!canLoad) {
      setItems([])
      setError(null)
      setLoading(false)
      return undefined
    }

    const controller = new AbortController()
    load({ signal: controller.signal })
    return () => {
      controller.abort()
      requestRef.current += 1
    }
  }, [canLoad, load])

  return {
    items,
    meta,
    loading,
    error,
    reload: () => load({ bypassCache: true }),
  }
}
