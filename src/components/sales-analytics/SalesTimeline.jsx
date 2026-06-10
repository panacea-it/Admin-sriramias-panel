import { cn } from '../../utils/cn'

const BADGE_STYLES = {
  page: 'bg-[#dbeafe] text-[#1d4ed8]',
  click: 'bg-[#ede9fe] text-[#6d28d9]',
  behavior: 'bg-[#fef3c7] text-[#b45309]',
  lead: 'bg-[#dcfce7] text-[#15803d]',
  payment: 'bg-[#ffedd5] text-[#c2410c]',
  failed: 'bg-[#fee2e2] text-[#b91c1c]',
  crm: 'bg-[#e0f2fe] text-[#0369a1]',
}

export default function SalesTimeline({ events }) {
  if (!events?.length) {
    return (
      <p className="rounded-xl border border-dashed border-[#e5e7eb] bg-[#fafafa] px-4 py-8 text-center text-sm text-[#686868]">
        No journey events recorded yet.
      </p>
    )
  }

  return (
    <ul className="relative space-y-0 pl-1">
      <span className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-[#e5e7eb]" aria-hidden />
      {events.map((event, i) => (
        <li key={event.id || i} className="relative flex gap-4 pb-6 last:pb-0">
          <span className="relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-white bg-[#246392] shadow ring-2 ring-[#246392]/30" />
          <div className="min-w-0 flex-1 rounded-xl bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-semibold text-[#111]">{event.label}</p>
              <span className="text-xs text-[#9ca0a8]">{event.time}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {event.badge && (
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                    BADGE_STYLES[event.badge] || BADGE_STYLES.page,
                  )}
                >
                  {event.badge}
                </span>
              )}
              {event.duration && (
                <span className="text-xs text-[#686868]">Duration: {event.duration}</span>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
