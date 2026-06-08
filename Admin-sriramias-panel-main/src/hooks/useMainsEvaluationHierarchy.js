import { useCallback, useEffect, useState } from 'react'
import {
  buildLatestMainsEvaluationCards,
  buildMainsFacultyRows,
} from '../utils/mainsEvaluationHierarchy'

export function useMainsEvaluationHierarchy() {
  const [facultyRows, setFacultyRows] = useState([])
  const [latestEvaluations, setLatestEvaluations] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    try {
      const rows = buildMainsFacultyRows()
      setFacultyRows(rows)
      setLatestEvaluations(buildLatestMainsEvaluationCards(3))
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

  return { facultyRows, latestEvaluations, loading, refresh }
}
