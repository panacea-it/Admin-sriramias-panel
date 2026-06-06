import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Lock } from 'lucide-react'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'
import { ROLE_MODULE_ROUTES, SECURITY_BADGES } from '../../data/adminManagementConfig'

/**
 * Role summary shown when selecting an admin type (Create Admin modal).
 */
export default function RoleOverviewCard({ role }) {
  const navigate = useNavigate()

  if (!role) return null

  const modules = Array.isArray(role.modules) ? role.modules : []
  const badge = SECURITY_BADGES[role.securityLevel] || SECURITY_BADGES.medium

  const handleModuleClick = (mod) => {
    const path = ROLE_MODULE_ROUTES[mod]
    if (path) {
      navigate(path)
      return
    }
    toast.info(`No quick link configured for "${mod}"`)
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={role.id}
        initial={{ opacity: 0, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.99 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-xl border border-slate-200/90 bg-white"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <h4 className="text-[15px] font-semibold leading-tight text-slate-900">{role.label}</h4>
            {role.description && (
              <p className="mt-1 text-[13px] leading-snug text-slate-500">{role.description}</p>
            )}
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset',
              badge.className,
            )}
          >
            <Lock className="h-3 w-3" />
            {badge.label}
          </span>
        </div>

        {modules.length > 0 && (
          <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              Module access
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod) => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => handleModuleClick(mod)}
                  className="flex min-h-[2.5rem] items-center rounded-lg border border-slate-200/90 bg-slate-50/50 px-3 py-2 text-left text-[13px] font-medium leading-snug text-slate-700 transition hover:border-violet-300 hover:bg-violet-50/40 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/25"
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-3.5 text-[13px] text-slate-600 sm:px-5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>
            <strong className="font-semibold text-slate-900">{role.permissionCount ?? 0}</strong>{' '}
            permissions mapped to this role
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
