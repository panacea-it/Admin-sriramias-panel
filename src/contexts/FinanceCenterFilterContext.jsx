import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from './AuthContext'
import { useCenters } from './CentersContext'
import { usePermissions } from '../hooks/usePermissions'
import { ROLES } from '../constants/roles'

const FAVORITES_KEY = 'finance_center_favorites'
const RECENT_KEY = 'finance_center_recent'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

const FinanceCenterFilterContext = createContext(null)

export function FinanceCenterFilterProvider({ children }) {
  const { user, selectedCenter, setSelectedCenter } = useAuth()
  const { activeCenters, getCenterById } = useCenters()
  const { isSuperAdmin, hasRole } = usePermissions()

  const [mode, setMode] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])
  const [compareMode, setCompareMode] = useState(false)
  const [favorites, setFavorites] = useState(() => readJson(FAVORITES_KEY, []))
  const [recentIds, setRecentIds] = useState(() => readJson(RECENT_KEY, []))

  const isCenterHead = hasRole(ROLES.CENTER_ADMIN)
  const isFinanceTeam = hasRole(ROLES.OPERATION_ADMIN)
  const canSelectCenters = isSuperAdmin || isFinanceTeam
  const lockedCenterId = isCenterHead
    ? activeCenters.find((c) => c.centerName === user?.center)?.centerId ||
      activeCenters.find((c) => c.centerName === selectedCenter)?.centerId
    : null

  useEffect(() => {
    if (lockedCenterId) {
      setMode('single')
      setSelectedIds([lockedCenterId])
      const c = getCenterById(lockedCenterId)
      if (c) setSelectedCenter(c.centerName)
    }
  }, [lockedCenterId, getCenterById, setSelectedCenter])

  const selectedCenters = useMemo(
    () =>
      mode === 'all'
        ? activeCenters
        : selectedIds.map((id) => getCenterById(id)).filter(Boolean),
    [mode, selectedIds, activeCenters, getCenterById],
  )

  const syncHeaderLabel = useCallback(
    (ids, nextMode) => {
      if (nextMode === 'all' || !ids.length) {
        setSelectedCenter('All Centers')
        return
      }
      if (ids.length === 1) {
        const c = getCenterById(ids[0])
        setSelectedCenter(c?.centerName || 'All Centers')
        return
      }
      setSelectedCenter(`${ids.length} Centers`)
    },
    [getCenterById, setSelectedCenter],
  )

  const pushRecent = useCallback((ids) => {
    setRecentIds((prev) => {
      const next = [...ids, ...prev.filter((id) => !ids.includes(id))].slice(0, 5)
      localStorage.setItem(RECENT_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    if (!canSelectCenters) return
    setMode('all')
    setSelectedIds([])
    setCompareMode(false)
    syncHeaderLabel([], 'all')
  }, [canSelectCenters, syncHeaderLabel])

  const selectSingle = useCallback(
    (centerId) => {
      if (lockedCenterId && centerId !== lockedCenterId) return
      setMode('single')
      setSelectedIds([centerId])
      setCompareMode(false)
      syncHeaderLabel([centerId], 'single')
      pushRecent([centerId])
    },
    [lockedCenterId, syncHeaderLabel, pushRecent],
  )

  const toggleMulti = useCallback(
    (centerId) => {
      if (!canSelectCenters || lockedCenterId) return
      setSelectedIds((prev) => {
        const has = prev.includes(centerId)
        const next = has ? prev.filter((id) => id !== centerId) : [...prev, centerId]
        const nextMode = next.length ? 'multi' : 'all'
        setMode(nextMode)
        syncHeaderLabel(next, nextMode)
        if (next.length) pushRecent([centerId])
        return next
      })
    },
    [canSelectCenters, lockedCenterId, syncHeaderLabel, pushRecent],
  )

  const setMultiSelection = useCallback(
    (ids) => {
      if (!canSelectCenters) return
      const unique = [...new Set(ids)]
      if (!unique.length) {
        selectAll()
        return
      }
      setMode(unique.length === 1 ? 'single' : 'multi')
      setSelectedIds(unique)
      syncHeaderLabel(unique, unique.length === 1 ? 'single' : 'multi')
      pushRecent(unique)
    },
    [canSelectCenters, selectAll, syncHeaderLabel, pushRecent],
  )

  const toggleFavorite = useCallback((centerId) => {
    setFavorites((prev) => {
      const next = prev.includes(centerId)
        ? prev.filter((id) => id !== centerId)
        : [...prev, centerId]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const apiParams = useMemo(() => {
    if (mode === 'all' || !selectedIds.length) {
      return { scope: 'overall' }
    }
    const centerNames = selectedCenters.map((c) => c.centerName).join(',')
    const centerIds = selectedIds.join(',')
    if (compareMode && selectedIds.length >= 2) {
      return { scope: 'compare', centerIds, centerNames }
    }
    if (selectedIds.length > 1) {
      return { scope: 'multi', centerIds, centerNames }
    }
    return { scope: 'center', centerIds, centerNames }
  }, [mode, compareMode, selectedIds, selectedCenters])

  const value = useMemo(
    () => ({
      mode,
      compareMode,
      setCompareMode,
      selectedIds,
      selectedCenters,
      favorites,
      recentIds,
      canSelectCenters,
      lockedCenterId,
      isOverallView: mode === 'all',
      isCenterView: mode === 'single',
      isMultiView: mode === 'multi',
      selectAll,
      selectSingle,
      toggleMulti,
      setMultiSelection,
      toggleFavorite,
      apiParams,
      headerLabel: selectedCenter,
    }),
    [
      mode,
      compareMode,
      selectedIds,
      selectedCenters,
      favorites,
      recentIds,
      canSelectCenters,
      lockedCenterId,
      selectAll,
      selectSingle,
      toggleMulti,
      setMultiSelection,
      toggleFavorite,
      apiParams,
      selectedCenter,
    ],
  )

  return (
    <FinanceCenterFilterContext.Provider value={value}>
      {children}
    </FinanceCenterFilterContext.Provider>
  )
}

export function useFinanceCenterFilter() {
  const ctx = useContext(FinanceCenterFilterContext)
  if (!ctx) throw new Error('useFinanceCenterFilter must be used within FinanceCenterFilterProvider')
  return ctx
}
