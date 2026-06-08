import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FINANCE_ROUTES } from '../constants/financeNav'
import StudentFinanceProfilePanel from '../components/finance/StudentFinanceProfilePanel'

const FinanceOperationsContext = createContext(null)

export function FinanceOperationsProvider({ children }) {
  const navigate = useNavigate()
  const [refreshToken, setRefreshToken] = useState(0)
  const [profileStudentId, setProfileStudentId] = useState(null)
  const [profileSeed, setProfileSeed] = useState(null)

  const bumpRefresh = useCallback(() => setRefreshToken((t) => t + 1), [])

  const openStudentProfile = useCallback((studentId, seed = null) => {
    setProfileStudentId(studentId)
    setProfileSeed(seed)
  }, [])

  const closeStudentProfile = useCallback(() => {
    setProfileStudentId(null)
    setProfileSeed(null)
  }, [])

  const goTo = useCallback(
    (routeKey, params = {}) => {
      const path = FINANCE_ROUTES[routeKey]
      if (!path) return
      const qs = new URLSearchParams(params).toString()
      navigate(qs ? `${path}?${qs}` : path)
    },
    [navigate],
  )

  const value = useMemo(
    () => ({
      refreshToken,
      bumpRefresh,
      openStudentProfile,
      closeStudentProfile,
      goToFinance: goTo,
      routes: FINANCE_ROUTES,
    }),
    [refreshToken, bumpRefresh, openStudentProfile, closeStudentProfile, goTo],
  )

  return (
    <FinanceOperationsContext.Provider value={value}>
      {children}
      <StudentFinanceProfilePanel
        studentId={profileStudentId}
        seed={profileSeed}
        onClose={closeStudentProfile}
      />
    </FinanceOperationsContext.Provider>
  )
}

export function useFinanceOperations() {
  const ctx = useContext(FinanceOperationsContext)
  if (!ctx) throw new Error('useFinanceOperations must be used within FinanceOperationsProvider')
  return ctx
}
