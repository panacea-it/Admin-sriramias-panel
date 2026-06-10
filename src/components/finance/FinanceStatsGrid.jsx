import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Responsive KPI grid with optional collapsible groups on mobile.
 * @param {{ id: string, label: string, title?: string, cards: React.ReactNode[] }[]} groups
 */
export default function FinanceStatsGrid({ groups = [], defaultCollapsedOnMobile = false, className }) {
  const [collapsed, setCollapsed] = useState(() =>
    Object.fromEntries(groups.map((g) => [g.id, defaultCollapsedOnMobile])),
  )

  const toggle = (id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))

  return (
    <div className={cn('space-y-4', className)}>
      {groups.map((group) => (
        <div key={group.id} className="rounded-xl bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm">
          {group.title && (
            <button
              type="button"
              onClick={() => toggle(group.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left sm:pointer-events-none sm:cursor-default"
              aria-expanded={!collapsed[group.id]}
            >
              <span className="text-xs font-bold uppercase tracking-wide text-[#246392] sm:text-sm">
                {group.title}
              </span>
              <span className="sm:hidden">
                {collapsed[group.id] ? (
                  <ChevronDown className="h-4 w-4 text-[#686868]" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-[#686868]" />
                )}
              </span>
            </button>
          )}
          <div
            className={cn(
              'grid gap-3 px-3 pb-3 sm:grid-cols-2 sm:gap-4 sm:px-4 sm:pb-4 lg:grid-cols-4',
              group.title && collapsed[group.id] && 'hidden sm:grid',
              !group.title && 'p-3 sm:p-4',
            )}
          >
            {group.cards}
          </div>
        </div>
      ))}
    </div>
  )
}
