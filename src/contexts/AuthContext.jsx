import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { login as loginApi, logout as logoutApi } from '../api/authAPI'
import { roleHasFullAccess } from '../config/rbacAccess'
import { ROLE_LABELS } from '../constants/roles'
import { AUTH_LOGOUT_EVENT } from '../utils/authEvents'
import { normalizeStoredUser } from '../utils/authHelpers'
import {
  clearAuthStorage,
  getAuthToken,
  getStoredUserJson,
  persistAuth,
} from '../utils/authStorage'

const AuthContext = createContext(null)

function readStoredSession() {
  const token = getAuthToken()
  const stored = getStoredUserJson()
  if (!token || !stored) return null
  try {
    return normalizeStoredUser(JSON.parse(stored))
  } catch {
    clearAuthStorage()
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [selectedCenter, setSelectedCenter] = useState('All Centers')
  const [authLoading, setAuthLoading] = useState(false)

  useEffect(() => {
    const sessionUser = readStoredSession()
    if (sessionUser) {
      setUser(sessionUser)
      setSelectedCenter(sessionUser.center || sessionUser.centers?.[0] || 'All Centers')
    }
    setBootstrapping(false)
  }, [])

  useEffect(() => {
    const onForcedLogout = () => setUser(null)
    window.addEventListener(AUTH_LOGOUT_EVENT, onForcedLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onForcedLogout)
  }, [])

  const login = useCallback(async (credentials) => {
    setAuthLoading(true)
    try {
      const { user: u, accessToken, refreshToken } = await loginApi(credentials)
      persistAuth(accessToken, u, {
        remember: Boolean(credentials.remember),
        refreshToken,
      })
      setUser(u)
      setSelectedCenter(u.center || u.centers?.[0] || 'All Centers')
      return u
    } finally {
      setAuthLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    logoutApi()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      loading: bootstrapping,
      authLoading,
      selectedCenter,
      setSelectedCenter,
      login,
      logout,
      roleLabel: user?.role ? ROLE_LABELS[user.role] : null,
      isSuperAdmin: roleHasFullAccess(user?.role),
    }),
    [user, bootstrapping, authLoading, selectedCenter, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with provider
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
