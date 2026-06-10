import { cn } from '../../utils/cn'

const TABS = [
  { id: 'youtube', label: 'Youtube Management' },
  { id: 'rank', label: 'Rank Management' },
  { id: 'review', label: 'App review' },
]

export default function WebsiteTabNav({ active, onChange }) {
  return (
    <nav
      className="flex gap-1 rounded-xl bg-[#e8eaef] p-1 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
      aria-label="Website sections"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-center text-[13px] font-semibold leading-tight transition-all duration-200 sm:px-4 sm:text-sm',
            active === tab.id
              ? 'bg-[#1a3a5c] text-white shadow-[0_2px_8px_rgba(26,58,92,0.35)]'
              : 'text-[#555] hover:bg-white/70 hover:text-[#111]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
