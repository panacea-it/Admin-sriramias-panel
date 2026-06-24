import { useCallback, useEffect, useState } from 'react'
import { fetchBookstoreDashboard } from '../../api/bookstoreAPI'

export function useBookstoreDashboard(filters = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const payload = await fetchBookstoreDashboard(filters)
      setData(payload)
    } finally {
      setLoading(false)
    }
  }, [filters.dateFrom, filters.dateTo])

  useEffect(() => {
    load()
  }, [load])

  return { data, loading }
}
