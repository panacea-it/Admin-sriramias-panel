import { useCallback, useEffect, useState } from 'react'
import { getRewardDashboard } from '../services/rewardService'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '@/utils/toast'

export function useRewardDashboard(period = 'weekly') {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const result = await getRewardDashboard({ period })
      setData(result)
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Failed to load reward dashboard')
      setLoadError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    reload()
  }, [reload])

  return { data, loading, loadError, reload }
}
