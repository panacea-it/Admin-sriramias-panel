import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { getRewardRules } from '../services/rewardService'
import { getEventTypeLabel, mapApiRuleToRow } from '../utils/rewardApiHelpers'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '@/utils/toast'

function filterRulesClientSide(rows, search, statusFilter) {
  let result = rows
  const q = search.trim().toLowerCase()

  if (q) {
    result = result.filter((row) => {
      const haystack = [
        row.name,
        getEventTypeLabel(row.eventType),
        row.eventType,
        row.status,
        row.rewardValue,
        row.dailyLimit,
        row.monthlyLimit,
        row.expiryDays,
      ]
      return haystack.some((v) => String(v ?? '').toLowerCase().includes(q))
    })
  }

  if (statusFilter && statusFilter !== 'all') {
    result = result.filter((row) => row.status === statusFilter)
  }

  return result
}

export function useRewardRulesManagement() {
  const [allRules, setAllRules] = useState([])
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
      setAllRules(rows)
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Failed to load reward rules')
      setLoadError(msg)
      toast.error(msg)
      setAllRules([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter])

  useEffect(() => {
    refresh()
  }, [refresh])

  const rules = useMemo(
    () => filterRulesClientSide(allRules, debouncedSearch, statusFilter),
    [allRules, debouncedSearch, statusFilter],
  )

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
      setAllRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    removeRuleLocally: (id) => setAllRules((prev) => prev.filter((r) => r.id !== id)),
  }
}
