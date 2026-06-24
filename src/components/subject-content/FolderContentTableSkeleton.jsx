import { cn } from '../../utils/cn'

export default function FolderContentTableSkeleton({ columnCount = 6, rowCount = 5 }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
      <div className="h-12 animate-pulse bg-gradient-to-r from-[#55ace7]/80 to-[#246392]/80" />
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rowCount }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className={cn(
              'flex items-center gap-4 px-4 py-4 animate-pulse sm:px-6',
              rowIdx % 2 === 1 && 'bg-slate-50/60',
            )}
          >
            <div className="h-4 w-4 shrink-0 rounded bg-slate-200" />
            {Array.from({ length: columnCount }).map((__, colIdx) => (
              <div
                key={colIdx}
                className={cn(
                  'h-3.5 rounded bg-slate-200/90',
                  colIdx === 0 ? 'w-32' : colIdx === columnCount - 1 ? 'ml-auto w-20' : 'w-20',
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
