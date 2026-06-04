import { Bell, Mail, MessageSquare } from 'lucide-react'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function OfflineNotificationsPanel({ notifications = [], onMarkRead }) {
  if (!notifications.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-6 text-center text-sm text-[#686868]">
        No offline payment notifications.
      </div>
    )
  }

  const channelIcon = (channel) => {
    if (channel === 'Email') return Mail
    if (channel === 'SMS') return MessageSquare
    return Bell
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {notifications.map((n) => {
        const Icon = channelIcon(n.channel)
        return (
          <li
            key={n.id}
            className={`flex items-start gap-3 px-4 py-3 ${n.read ? 'opacity-70' : 'bg-[#eef6fc]/30'}`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef6fc] text-[#246392]">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#222]">{n.message || n.statusUpdate}</p>
              <p className="text-xs text-[#686868]">
                {n.studentName} · {n.channel}
                {n.timestamp && ` · ${formatCategoryDateTime(n.timestamp)}`}
              </p>
            </div>
            {!n.read && onMarkRead && (
              <button
                type="button"
                onClick={() => onMarkRead(n.id)}
                className="shrink-0 text-xs font-semibold text-[#246392] hover:underline"
              >
                Mark read
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
