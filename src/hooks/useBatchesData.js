import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCourses } from '../api/coursesAPI'
import {
  enrichBatchRow,
  mapInitialBatchesToRows,
} from '../utils/batchHelpers'

export function useBatchesData({ enabled = true } = {}) {
  const [apiBatches, setApiBatches] = useState([])
  const [loading, setLoading] = useState(Boolean(enabled))

  const loadBatches = useCallback(async ({ silent = false } = {}) => {
    if (!enabled) return
    if (!silent) setLoading(true)
    try {
      const rows = await fetchCourses()
      setApiBatches(rows.map((row, i) => enrichBatchRow(row, i)))
    } catch {
      setApiBatches(mapInitialBatchesToRows().map((row, i) => enrichBatchRow(row, i)))
    } finally {
      if (!silent) setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return undefined
    }
    loadBatches()
    return undefined
  }, [enabled, loadBatches])

  const sourceRows = useMemo(() => {
    if (apiBatches.length > 0) return apiBatches
    return mapInitialBatchesToRows()
  }, [apiBatches])

  const existingCourseIds = useMemo(
    () => apiBatches.map((b) => b.courseId).filter(Boolean),
    [apiBatches],
  )

  return {
    apiBatches,
    sourceRows,
    loading,
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
