import { cn } from '../../utils/cn'

export default function FinanceTableSkeleton({ rows = 6, columns = 6, className }) {
  return (
    <div
      className={cn(
        'animate-pulse overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <div className="h-11 bg-gradient-to-r from-[#eef2fc] to-[#e8f4fc]" />
      <div className="divide-y divide-slate-100 p-2">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-3 px-3 py-3">
            {Array.from({ length: columns }).map((__, colIdx) => (
              <div
                key={colIdx}
                className={cn(
                  'h-4 rounded-md bg-[#eef2fc]',
                  colIdx === 0 ? 'w-[18%]' : 'flex-1',
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
