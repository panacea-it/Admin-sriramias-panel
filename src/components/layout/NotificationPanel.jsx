import { Clock3 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function NotificationPanel({
  notifications,
  unreadCount,
  onMarkAllRead,
  className,
}) {
  return (
    <div
      className={cn(
        'flex max-h-[min(520px,calc(100vh-5rem))] w-[min(100vw-1.5rem,380px)] flex-col overflow-hidden rounded-2xl border border-violet-100/80 bg-[#faf8ff] shadow-[0_20px_50px_rgba(88,28,135,0.18)]',
        className,
      )}
      role="dialog"
      aria-label="Notifications"
    >
      <div className="shrink-0 bg-gradient-to-r from-[#7c3aed] via-[#a855f7] to-[#ec4899] px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white sm:text-lg">Notifications</h2>
            <p className="mt-0.5 text-xs font-medium text-white/85 sm:text-sm">
              {unreadCount} unread
            </p>
          </div>
          <button
            type="button"
            onClick={onMarkAllRead}
            className="shrink-0 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/30"
          >
            Mark all read
          </button>
        </div>
      </div>

      <ul className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {notifications.map((n) => {
          const Icon = n.icon
          return (
            <li
              key={n.id}
              className={cn(
                'rounded-xl border bg-white p-3.5 shadow-sm transition hover:shadow-md sm:p-4',
                n.read ? 'border-slate-100 opacity-90' : 'border-violet-100',
              )}
            >
              <div className="flex gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: n.iconBg }}
                >
                  <Icon size={20} style={{ color: n.iconColor }} strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    {n.message}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <Clock3 size={12} className="shrink-0" />
                    {n.time}
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
