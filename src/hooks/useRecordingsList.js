import { useCallback, useEffect, useRef, useState } from 'react'
import { postFacultySubjectCategoryContent } from '../api/recordingsAPI'
import {
  mapApiRecordingToFolderItem,
  normalizeRecordingsListMeta,
  normalizeRecordingsListResponse,
} from '../utils/recordingHelpers'

const SEARCH_DEBOUNCE_MS = 300

function filterRecordingsBySearch(rows, search) {
  const query = String(search || '').trim().toLowerCase()
  if (!query) return rows
  return rows.filter((row) => {
    const haystack = [
      row.lessonName,
      row.center,
      row.batchName,
      row.topic,
      row.teacher,
      row.tags,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(query)
  })
}

export function useRecordingsList({
  facultySubjectId,
  folderId,
  enabled = false,
} = {}) {
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 })
  const [dashboardSummary, setDashboardSummary] = useState({ totalRecordings: 0 })
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [listLoading, setListLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const listRequestRef = useRef(0)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (search !== debouncedSearch) setSearchLoading(true)
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      setSearchLoading(false)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, debouncedSearch])

  const loadRecordings = useCallback(
    async ({ signal } = {}) => {
      if (!facultySubjectId || !folderId) {
        setItems([])
        setDashboardSummary({ totalRecordings: 0 })
        return []
      }

      const requestId = ++listRequestRef.current
      setListLoading(true)

      try {
        const data = await postFacultySubjectCategoryContent(
          {
            facultySubjectId,
            category: 'RECORDING',
            folderId,
          },
          { signal },
        )
        if (requestId !== listRequestRef.current) return []

        const apiRows = filterRecordingsBySearch(
          normalizeRecordingsListResponse(data),
          debouncedSearch,
        )
        const listMeta = normalizeRecordingsListMeta(data)
        const total = debouncedSearch ? apiRows.length : listMeta.total || apiRows.length

        setMeta({ ...listMeta, total })
        setItems(apiRows)
        setDashboardSummary({ totalRecordings: total, folderId, facultySubjectId })
        return apiRows
      } catch {
        if (requestId !== listRequestRef.current) return []
        setItems([])
        setDashboardSummary({ totalRecordings: 0 })
        return []
      } finally {
        if (requestId === listRequestRef.current) {
          setListLoading(false)
        }
      }
    },
    [facultySubjectId, folderId, debouncedSearch],
  )

  const syncFolderItems = useCallback(
    async (existingItems = []) => {
      const apiRows = await loadRecordings()
      const existingByLinkedId = new Map(
        (existingItems || []).map((item) => [String(item.linkedExistingFormId), item]),
      )
      return apiRows
        .map((row) => mapApiRecordingToFolderItem(row, existingByLinkedId.get(String(row.id))))
        .filter(Boolean)
    },
    [loadRecordings],
  )

  const refreshAll = useCallback(
    async (existingItems = []) => syncFolderItems(existingItems),
    [syncFolderItems],
  )

  useEffect(() => {
    if (!enabled) {
      setDashboardSummary({ totalRecordings: 0 })
    }
  }, [enabled])

  return {
    items,
    meta,
    dashboardSummary,
    search,
    setSearch,
    page,
    setPage,
    limit,
    listLoading: listLoading || searchLoading,
    summaryLoading: listLoading,
    loadRecordings,
    loadDashboardSummary: loadRecordings,
    syncFolderItems,
    refreshAll,
  }
}
