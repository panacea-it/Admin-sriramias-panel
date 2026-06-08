import { useCallback, useEffect, useState } from 'react'
import { fetchBookstoreDashboard } from '../../api/bookstoreAPI'

export function useBookstoreDashboard(filters = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      try {
        const payload = await fetchBookstoreDashboard(filters)
        setData(payload)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [filters.dateFrom, filters.dateTo],
  )

  useEffect(() => {
    load()
  }, [load])

  return { data, loading, refreshing, reload: () => load(true) }
}
