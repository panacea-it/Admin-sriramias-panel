import { Play, FileQuestion, FileText, StickyNote } from 'lucide-react'
import { cn } from '../../utils/cn'

const TABS = [
  { id: 'videos', label: 'Videos', icon: Play },
  { id: 'tests', label: 'Tests', icon: FileQuestion },
  { id: 'pdfs', label: 'PDFs', icon: FileText },
  { id: 'notes', label: 'Notes', icon: StickyNote },
]

export default function ResourceTabs({ activeTab, onChange, counts = {} }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition',
            activeTab === id
              ? 'border-[#55ace7] text-[#1a3a5c]'
              : 'border-transparent text-slate-500 hover:text-slate-700',
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
          {counts[id] != null && counts[id] > 0 && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                activeTab === id ? 'bg-[#55ace7]/15 text-[#246392]' : 'bg-slate-100 text-slate-500',
              )}
            >
              {counts[id]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
