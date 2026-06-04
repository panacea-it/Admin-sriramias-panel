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
        className="overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50/95 via-white/90 to-violet-50/30 p-6 shadow-sm ring-1 ring-slate-100/90 sm:p-7 md:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 sm:gap-6">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              Role overview
            </p>
            <h3 className="text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl">
              {role.label}
            </h3>
          </div>
          <span
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset',
              badge.className,
            )}
          >
            <Lock className="h-3.5 w-3.5" />
            {badge.label}
          </span>
        </div>

        <p className="mt-5 max-w-none text-[15px] leading-[1.65] text-slate-600 sm:text-base sm:leading-relaxed">
          {role.description}
        </p>

        <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-3">
          {modules.map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => handleModuleClick(mod)}
              className="inline-flex rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-[13px] font-medium leading-tight text-slate-700 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:border-violet-300 hover:text-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/25"
            >
              {mod}
            </button>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-slate-200/90 pt-5">
          <div className="flex items-center gap-2.5 text-[15px] text-slate-600">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <span>
              <strong className="font-bold text-slate-900">
                {role.permissionCount ?? 0}
              </strong>{' '}
              permissions mapped
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
