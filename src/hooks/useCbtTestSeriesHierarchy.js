import { useCallback, useEffect, useState } from 'react'
import {
  buildCbtMappingRows,
  buildLatestCbtEvaluationCards,
} from '../utils/cbtTestSeriesHierarchy'

export function useCbtTestSeriesHierarchy() {
  const [mappingRows, setMappingRows] = useState([])
  const [latestEvaluations, setLatestEvaluations] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    try {
      const rows = buildCbtMappingRows()
      setMappingRows(rows)
      setLatestEvaluations(buildLatestCbtEvaluationCards(3))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const onUpdate = () => refresh()
    window.addEventListener('faculty-subject-content-updated', onUpdate)
    window.addEventListener('academics-subjects-updated', onUpdate)
    return () => {
      window.removeEventListener('faculty-subject-content-updated', onUpdate)
      window.removeEventListener('academics-subjects-updated', onUpdate)
    }
  }, [refresh])

  return { mappingRows, latestEvaluations, loading, refresh }
}
