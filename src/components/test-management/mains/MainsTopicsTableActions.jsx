import { Eye } from 'lucide-react'
import { cn } from '../../../utils/cn'

const actionButtonClass =
  'inline-flex h-8 min-w-[2rem] shrink-0 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold transition sm:min-w-0 sm:px-2.5'

export default function MainsTopicsTableActions({ row, onView }) {
  return (
    <div className="flex flex-nowrap items-center justify-center gap-1 sm:gap-1.5">
      <button
        type="button"
        onClick={onView}
        title="View Test Series"
        aria-label={`View test series for ${row.title}`}
        className={cn(
          actionButtonClass,
          'text-slate-500 hover:bg-slate-100 hover:text-[#246392]',
        )}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">View Test Series</span>
      </button>
    </div>
  )
}
