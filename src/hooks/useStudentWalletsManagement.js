import { useCallback, useEffect, useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'
import { getStudentWallets } from '../services/rewardService'
import { mapApiWalletToRow } from '../utils/rewardApiHelpers'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '@/utils/toast'

export function useStudentWalletsManagement() {
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [centerFilter, setCenterFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const debouncedSearch = useDebouncedValue(search, 400)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getStudentWallets({
        search: debouncedSearch,
        center: centerFilter === 'all' ? undefined : centerFilter,
        course: courseFilter === 'all' ? undefined : courseFilter,
      })
      const rows = (Array.isArray(data) ? data : data?.items || []).map(mapApiWalletToRow).filter(Boolean)
      setWallets(rows)
    } catch (error) {
      const msg = getApiErrorMessage(error, 'Failed to load wallets')
      setLoadError(msg)
      toast.error(msg)
      setWallets([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, centerFilter, courseFilter])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    wallets,
    loading,
    loadError,
    search,
    setSearch,
    centerFilter,
    setCenterFilter,
    courseFilter,
    setCourseFilter,
    refresh,
  }
}
