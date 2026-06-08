import { cn } from '../../utils/cn'

export default function FinanceDashboardSkeleton({ className }) {
  return (
    <div className={cn('animate-pulse space-y-4', className)}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white/80 shadow" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-xl bg-white/80 shadow" />
        <div className="h-56 rounded-xl bg-white/80 shadow" />
      </div>
    </div>
  )
}
