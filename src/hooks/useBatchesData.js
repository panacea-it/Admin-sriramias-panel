import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchBatches } from '../api/batchesAPI'
import { enrichBatchRow } from '../utils/batchHelpers'
import { getApiErrorMessage } from '../utils/apiError'

export function useBatchesData({ enabled = true } = {}) {
  const [apiBatches, setApiBatches] = useState([])
  const [loading, setLoading] = useState(Boolean(enabled))
  const [error, setError] = useState(null)

  const loadBatches = useCallback(async ({ silent = false } = {}) => {
    if (!enabled) return
    if (!silent) setLoading(true)
    try {
      const { rows } = await fetchBatches({ page: 1, limit: 500 })
      setApiBatches(rows.map((row, i) => enrichBatchRow(row, i)))
      setError(null)
    } catch (err) {
      setApiBatches([])
      setError(getApiErrorMessage(err, 'Failed to load batches'))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return undefined
    const timer = window.setTimeout(() => {
      void loadBatches()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [enabled, loadBatches])

  const sourceRows = useMemo(() => apiBatches, [apiBatches])

  const existingCourseIds = useMemo(
    () => apiBatches.map((b) => b.courseId).filter(Boolean),
    [apiBatches],
  )

  return {
    apiBatches,
    sourceRows,
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
