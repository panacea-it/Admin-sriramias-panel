import { LEADERBOARD_PERIODS } from '../../constants/rewards'
import { cn } from '../../utils/cn'

export default function LeaderboardTabs({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2" role="tablist" aria-label="Leaderboard period">
      {LEADERBOARD_PERIODS.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'inline-flex min-h-[36px] items-center rounded-md px-3 py-1.5 text-xs font-semibold transition-colors sm:text-[13px]',
            value === tab.value
              ? 'bg-gradient-to-r from-[#55ace7] to-[#246392] text-white shadow-sm'
              : 'bg-white text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-50',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
