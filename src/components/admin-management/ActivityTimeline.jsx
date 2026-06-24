import { motion } from 'framer-motion'
import { UserPlus, LogIn, Shield, AlertTriangle, Activity } from 'lucide-react'
import { cn } from '../../utils/cn'
import { RECENT_ACTIVITY } from '../../data/adminManagementConfig'

const typeIcons = {
  created: UserPlus,
  login: LogIn,
  permission: Shield,
  security: AlertTriangle,
}

const statusStyles = {
  success: 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/20',
  info: 'bg-sky-500/15 text-sky-700 ring-sky-500/20',
  warning: 'bg-amber-500/15 text-amber-800 ring-amber-500/20',
  danger: 'bg-rose-500/15 text-rose-700 ring-rose-500/20',
}

export default function ActivityTimeline() {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/75 shadow-[0_8px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl"
    >
      <div className="border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-violet-600" />
          <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Admins, logins, permissions & security
        </p>
      </div>

      <div className="custom-scrollbar flex-1 space-y-0 overflow-y-auto px-4 py-4 max-h-[min(70vh,640px)]">
        {RECENT_ACTIVITY.map((item, i) => {
          const Icon = typeIcons[item.type] || Activity
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="relative flex gap-3 pb-6 last:pb-0"
            >
              {i < RECENT_ACTIVITY.length - 1 && (
                <span
                  className="absolute left-[15px] top-9 bottom-0 w-px bg-slate-200"
                  aria-hidden
                />
              )}
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-[10px] font-bold text-white shadow-md">
                {item.user}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset',
                      statusStyles[item.status],
                    )}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  {item.description}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                  <Icon className="h-3 w-3" />
                  {item.time}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.aside>
  )
}
