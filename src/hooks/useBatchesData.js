import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchBatches } from '../api/batchesAPI'
import { enrichBatchRow } from '../utils/batchHelpers'
import { getApiErrorMessage } from '../utils/apiError'
import { isMongoObjectId } from '../utils/facultySubjectHelpers'

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

  const loadBatches = useCallback(
    async ({ silent = false, page: pageOverride, limit: limitOverride } = {}) => {
      if (!enabled) return
      const requestId = ++requestIdRef.current
      if (!silent) setLoading(true)
      try {
        const { rows, meta: listMeta } = await fetchBatches({
          page: pageOverride ?? page,
          limit: limitOverride ?? limit,
          search,
          status,
        })
        if (requestId !== requestIdRef.current) return
        setApiBatches(rows.map((row, i) => enrichBatchRow(row, i)))
        setMeta(listMeta)
        setError(null)
      } catch (err) {
        if (requestId !== requestIdRef.current) return
        setApiBatches([])
        setMeta({ total: 0, page: 1, limit, totalPages: 1, count: 0 })
        setError(getApiErrorMessage(err, 'Failed to load batches'))
      } finally {
        if (requestId === requestIdRef.current && !silent) setLoading(false)
      }
    },
    [enabled, page, limit, search, status],
  )

  useEffect(() => {
    if (!enabled) return undefined
    void loadBatches()
    return undefined
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

export function findBatchRow(rows, batchIdParam) {
  if (!batchIdParam) return null
  const decoded = decodeURIComponent(String(batchIdParam))
  return (
    rows.find((r) => {
      const id = String(r.id ?? '')
      const batchId = String(r.batchId ?? '')
      const courseId = String(r.courseId ?? '')
      return id === decoded || batchId === decoded || courseId === decoded
    }) ?? null
  )
}

/** Resolve Mongo _id for batch API calls from a route param or batch row. */
export function resolveBatchMongoId(batchOrRouteParam, rows = []) {
  if (batchOrRouteParam == null || batchOrRouteParam === '') return ''

  if (typeof batchOrRouteParam === 'object') {
    const mongoId = batchOrRouteParam.id ?? batchOrRouteParam._id
    if (isMongoObjectId(mongoId)) return String(mongoId).trim()
    const code = batchOrRouteParam.batchId
    if (code) return resolveBatchMongoId(code, rows)
    return ''
  }

  const param = decodeURIComponent(String(batchOrRouteParam)).trim()
  if (!param) return ''
  if (isMongoObjectId(param)) return param

  const row = findBatchRow(rows, param)
  if (row?.id && isMongoObjectId(row.id)) return String(row.id).trim()

  return ''
}
