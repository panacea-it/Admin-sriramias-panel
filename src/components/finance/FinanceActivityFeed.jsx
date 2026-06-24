import { formatCategoryDateTime } from '../../utils/formatDateTime'
import FinanceStatusBadge from './FinanceStatusBadge'

export default function FinanceActivityFeed({ items = [], title = 'Recent finance activity' }) {
  if (!items.length) {
    return (
      <div className="rounded-xl bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
        <h3 className="mb-2 text-sm font-bold text-[#246392]">{title}</h3>
        <p className="text-sm text-[#686868]">No recent activity</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:p-5">
      <h3 className="mb-3 text-sm font-bold text-[#246392]">{title}</h3>
      <ul className="space-y-2">
        {items.slice(0, 8).map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-[#111]">{item.title}</p>
              <p className="text-xs text-[#686868]">{item.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {item.status && <FinanceStatusBadge status={item.status} />}
              <span className="text-xs text-[#9ca0a8]">{formatCategoryDateTime(item.at)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
