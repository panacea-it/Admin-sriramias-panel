import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCourses } from '../api/coursesAPI'
import { mapInitialBatchesToRows } from '../utils/batchHelpers'

function toBatchOptions(rows) {
  return (rows || [])
    .filter((row) => row?.id)
    .map((row) => {
      const batchName = row.batchName || row.name || 'Unnamed batch'
      const courseName = row.courseName || row.linkedCourseName || ''
      const label = courseName ? `${batchName} · ${courseName}` : batchName
      return {
        value: String(row.id),
        label,
        courseId: row.courseId || '',
        batchName,
      }
    })
}

export function useBatchSelectOptions({ enabled = true } = {}) {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      const rows = await fetchCourses()
      const list = rows?.length ? rows : mapInitialBatchesToRows()
      setBatches(list)
      setError(null)
    } catch {
      setBatches(mapInitialBatchesToRows())
      setError('Failed to load batches')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!enabled) return undefined
    const refresh = () => load()
    window.addEventListener('batches-api-updated', refresh)
    return () => window.removeEventListener('batches-api-updated', refresh)
  }, [enabled, load])

  const options = useMemo(() => toBatchOptions(batches), [batches])

  return { options, batches, loading, error, reload: load }
}
