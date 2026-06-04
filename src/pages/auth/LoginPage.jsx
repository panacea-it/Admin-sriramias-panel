import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { toast } from '@/utils/toast'
import { useAuth } from '../../contexts/AuthContext'
import { getDefaultRouteForRole } from '../../config/rbacAccess'
import { LOGIN_ROLE_OPTIONS } from '../../constants/roles'
import { getDemoUserByRole } from '../../data/demoAuthUsers'
import SriramLogo from '../../components/brand/SriramLogo'
import { cn } from '../../utils/cn'
import {
  firstLoginValidationMessage,
  validateLoginFields,
} from '../../utils/loginValidation'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, authLoading, isAuthenticated, loading, user } = useAuth()
  const [selectedRole, setSelectedRole] = useState(LOGIN_ROLE_OPTIONS[0].id)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })
  const submitLock = useRef(false)

  useEffect(() => {
    const demo = getDemoUserByRole(LOGIN_ROLE_OPTIONS[0].id)
    if (demo) setForm({ email: demo.email, password: demo.password })
  }, [])

  const redirectTo =
    location.state?.from?.pathname && location.state.from.pathname !== '/login'
      ? location.state.from.pathname
      : getDefaultRouteForRole(selectedRole)

  useEffect(() => {
    if (!loading && isAuthenticated && user?.role) {
      const target =
        location.state?.from?.pathname && location.state.from.pathname !== '/login'
          ? location.state.from.pathname
          : getDefaultRouteForRole(user.role)
      navigate(target, { replace: true })
    }
  }, [isAuthenticated, loading, navigate, location.state, user?.role])

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId)
    const demo = getDemoUserByRole(roleId)
    if (demo) {
      setForm({ email: demo.email, password: demo.password })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (authLoading || submitLock.current) return

    const fieldErrors = validateLoginFields(form)
    const validationMessage = firstLoginValidationMessage(fieldErrors)
    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    submitLock.current = true
    try {
      await login({
        ...form,
        expectedRole: selectedRole,
        remember: rememberMe,
      })
      toast.success('Login successful')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message =
        err?.message ||
        err?.cause?.message ||
        err?.cause?.response?.data?.message ||
        'Login failed'
      toast.error(message)
    } finally {
      submitLock.current = false
    }
  }

  return (
    <div className="figma-admin-section flex min-h-screen w-full bg-[#f7f7f7]">
      <div className="relative hidden w-[48%] max-w-[640px] shrink-0 flex-col justify-between overflow-hidden bg-[#03045e] p-10 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(31,162,255,0.15)_0%,transparent_45%),linear-gradient(320deg,rgba(223,130,132,0.12)_0%,transparent_50%)]" />
        <div className="relative">
          <SriramLogo variant="login" />
          <h1 className="mt-8 max-w-sm text-3xl font-black leading-tight xl:text-[2.35rem]">
            Admin Portal
          </h1>
          <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-white/75">
            Role-based access for centers, operations, content, mentors, faculty, and counseling
            teams — one secure platform.
          </p>
        </div>
        <ul className="relative space-y-2.5 text-sm font-medium text-white/70">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1fa2ff]" />
            Dynamic sidebar & route protection
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ef8b8b]" />
            Permission-aware dashboards
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ca8a04]" />
            Demo credentials for every role
          </li>
        </ul>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[480px]">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <SriramLogo variant="login" className="mx-auto object-center" linkClassName="justify-center" />
            <h2 className="mt-5 text-xl font-bold text-[#111111]">Admin Sign In</h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow-[0_11px_25px_rgba(15,23,42,0.08)] sm:p-8"
          >
            <div className="mb-5 hidden lg:block">
              <h2 className="text-xl font-bold text-[#111111]">Sign in</h2>
              <p className="mt-1 text-sm text-[#686868]">Choose your role and enter credentials</p>
            </div>

            <div className="mb-5">
              <p className="mb-2.5 text-sm font-semibold text-[#333]">Login as</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                {LOGIN_ROLE_OPTIONS.map((opt) => {
                  const active = selectedRole === opt.id
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleRoleSelect(opt.id)}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-left transition-all duration-200',
                        active
                          ? 'border-[#55ace7] bg-[#eef6fc] shadow-[0_0_0_1px_#55ace7]'
                          : 'border-[#e8ecf4] bg-[#f9fafc] hover:border-[#55ace7]/40 hover:bg-[#eef6fc]/60',
                      )}
                    >
                      <span className="block text-[13px] font-bold text-[#111111]">{opt.label}</span>
                      <span className="mt-0.5 block text-[11px] font-medium leading-snug text-[#686868]">
                        {opt.short}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRole}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#333]">Email address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9ca0a8]" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@sriramias.com"
                      required
                      autoComplete="username"
                      className="h-11 w-full rounded-lg bg-[#eef2fc] pl-11 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#333]">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#9ca0a8]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="h-11 w-full rounded-lg bg-[#eef2fc] pl-11 pr-11 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#687180]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <label className="mt-4 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[#c5cad6] text-[#246392] focus:ring-[#55ace7]"
              />
              <span className="text-sm font-medium text-[#555]">Remember me</span>
            </label>

            <button
              type="submit"
              disabled={authLoading}
              aria-busy={authLoading}
              className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] text-sm font-bold text-white shadow-[0_5px_13px_rgba(36,99,146,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              {authLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>

            <p className="mt-5 text-center text-xs font-medium text-[#9ca0a8]">
              Demo accounts available for each role when API is offline
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
