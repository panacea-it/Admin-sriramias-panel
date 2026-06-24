import { Bell, Clock3 } from 'lucide-react'
import DashboardNavLink from './DashboardNavLink'

export default function ActivityCard({ text, sub, time, bg, href }) {
  const content = (
    <>
      <div className="flex min-w-0 items-start gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <Bell className="h-5 w-5 text-[#c0b400]" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold leading-snug text-gray-800">{text}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 self-end text-xs text-gray-500 sm:self-center">
        <Clock3 size={12} />
        <span className="whitespace-nowrap">{time}</span>
      </span>
    </>
  )

  const layoutClass =
    'flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between'

  if (!href) {
    return (
      <article className={layoutClass} style={{ background: bg }}>
        {content}
      </article>
    )
  }

  return (
    <DashboardNavLink
      to={href}
      ariaLabel={`Open activity: ${text}`}
      className={layoutClass}
      style={{ background: bg }}
    >
      {content}
    </DashboardNavLink>
  )
}
