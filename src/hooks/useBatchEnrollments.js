import { useCallback, useEffect, useRef, useState } from 'react'
import { getBatchStudents } from '../services/batchEnrollmentService'
import { resolveEnrollmentApiId } from '../components/batch-management/enrollmentHelpers'
import { getApiErrorMessage } from '../utils/apiError'
import { isMongoObjectId } from '../utils/facultySubjectHelpers'
import { useDebouncedValue } from './useDebouncedValue'

const DEFAULT_META = { total: 0, page: 1, pages: 1, limit: 10 }

export function useBatchEnrollments(batchId, { enabled = true, initialPageSize = 10 } = {}) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [students, setStudents] = useState([])
  const [meta, setMeta] = useState(DEFAULT_META)
  const [loading, setLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState(null)

  const debouncedSearch = useDebouncedValue(search, 400)
  const requestRef = useRef(0)
  const abortRef = useRef(null)

  const listQuery = useCallback(
    () => ({
      search: debouncedSearch,
      page,
      limit: pageSize,
    }),
    [debouncedSearch, page, pageSize],
  )

  const fetchStudents = useCallback(
    async (queryOverrides = {}, { signal, applyState = true } = {}) => {
      if (!enabled || !batchId || !isMongoObjectId(batchId)) {
        if (applyState) {
          setStudents([])
          setMeta(DEFAULT_META)
        }
        return { students: [], meta: DEFAULT_META }
      }

      const query = { ...listQuery(), ...queryOverrides }
      const { students: rows, meta: listMeta } = await getBatchStudents(batchId, query, { signal })

      if (applyState) {
        setStudents(rows)
        setMeta(listMeta)
      }

      return { students: rows, meta: listMeta }
    },
    [enabled, batchId, listQuery],
  )

  const loadStudents = useCallback(
    async ({ silent = false } = {}) => {
      if (!enabled || !batchId || !isMongoObjectId(batchId)) {
        setStudents([])
        setMeta(DEFAULT_META)
        setLoading(false)
        setSearchLoading(false)
        return { students: [], meta: DEFAULT_META }
      }

      if (abortRef.current) abortRef.current.abort()
      const ac = new AbortController()
      abortRef.current = ac
      const requestId = ++requestRef.current

      if (!silent) setLoading(true)
      setSearchLoading(Boolean(debouncedSearch.trim()))
      setError(null)

      try {
        const result = await fetchStudents({}, { signal: ac.signal, applyState: true })
        if (requestId !== requestRef.current) return result
        return result
      } catch (err) {
        if (requestId !== requestRef.current) return null
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return null
        setStudents([])
        setMeta({ ...DEFAULT_META, limit: pageSize })
        setError(getApiErrorMessage(err, 'Failed to load students'))
        return null
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false)
          setSearchLoading(false)
        }
      }
    },
    [enabled, batchId, debouncedSearch, pageSize, fetchStudents],
  )

  /** Mutation refetch — no abort, always applies fresh list (edit/view/save). */
  const refetchStudentsAfterMutation = useCallback(async () => {
    if (!enabled || !batchId || !isMongoObjectId(batchId)) {
      return { students: [], meta: DEFAULT_META }
    }
    try {
      return await fetchStudents({}, { applyState: true })
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return null
      throw err
    }
  }, [enabled, batchId, fetchStudents])

  useEffect(() => {
    void loadStudents()
    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [loadStudents])

  useEffect(() => {
    setPage(1)
  }, [batchId])

  const handleSearchChange = useCallback((value) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((nextPage) => {
    setPage(nextPage)
  }, [])

  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size)
    setPage(1)
  }, [])

  const mergeEnrollmentUpdate = useCallback((updatedRow) => {
    if (!updatedRow) return
    const targetId = resolveEnrollmentApiId(updatedRow)
    const displayId = String(updatedRow.enrollmentId || '').trim()
    setStudents((prev) => {
      const index = prev.findIndex((row) => {
        if (targetId && resolveEnrollmentApiId(row) === targetId) return true
        if (displayId && displayId !== '—') {
          return String(row.enrollmentId || '').trim() === displayId
        }
        return false
      })
      if (index === -1) return prev
      const next = [...prev]
      next[index] = {
        ...prev[index],
        ...updatedRow,
        enrollmentApiId: targetId || prev[index].enrollmentApiId,
        id: targetId || prev[index].id || displayId,
      }
      return next
    })
  }, [])

  return {
    students,
    meta,
    loading,
    searchLoading,
    error,
    search,
    page,
    pageSize,
    setSearch: handleSearchChange,
    setPage: handlePageChange,
    setPageSize: handlePageSizeChange,
    refetchStudents: loadStudents,
    refetchStudentsAfterMutation,
    mergeEnrollmentUpdate,
  }
}
