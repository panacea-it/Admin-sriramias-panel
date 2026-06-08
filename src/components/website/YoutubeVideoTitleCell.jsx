import { Star } from 'lucide-react'
import { cn } from '../../utils/cn'

const LABEL_STYLES = {
  Featured: 'bg-amber-50 text-amber-800 ring-amber-200/80',
  Trending: 'bg-rose-50 text-rose-700 ring-rose-200/80',
  'Most Watched': 'bg-violet-50 text-violet-700 ring-violet-200/80',
}

export default function YoutubeVideoTitleCell({ name, isFeatured, analyticsLabels = [] }) {
  const labels = [...new Set(analyticsLabels)]
  if (isFeatured && !labels.includes('Featured')) labels.unshift('Featured')

  return (
    <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex min-w-0 items-center gap-1.5">
        {isFeatured && (
          <Star
            className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500 drop-shadow-sm"
            aria-label="Featured video"
          />
        )}
        <span className="truncate font-medium text-[#111]" title={name}>
          {name}
        </span>
      </div>
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {labels.map((label) => (
            <span
              key={label}
              className={cn(
                'inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1',
                LABEL_STYLES[label] ?? 'bg-slate-50 text-slate-600 ring-slate-200',
              )}
            >
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
