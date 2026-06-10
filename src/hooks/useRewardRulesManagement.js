import { useCallback, useEffect, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { getRewardRules } from '../services/rewardService'
import { mapApiRuleToRow } from '../utils/rewardApiHelpers'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '@/utils/toast'

export function useRewardRulesManagement() {
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 400)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getRewardRules({
        search: debouncedSearch,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
      const rows = (Array.isArray(data) ? data : data?.items || []).map(mapApiRuleToRow).filter(Boolean)
      setRules(rows)
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Failed to load reward rules')
      setLoadError(msg)
      toast.error(msg)
      setRules([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    rules,
    loading,
    loadError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refresh,
    patchRuleLocally: (id, patch) =>
      setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    removeRuleLocally: (id) => setRules((prev) => prev.filter((r) => r.id !== id)),
  }
}
