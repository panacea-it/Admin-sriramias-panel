import { cn } from '../../../../utils/cn'

export default function CbtProgressBar({
  label,
  value = 0,
  showValue = true,
  color = '#55ace7',
  className,
}) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0))

  return (
    <div className={cn('mt-auto', className)}>
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-medium text-slate-500 sm:text-xs">
        <span>{label}</span>
        {showValue ? <span className="tabular-nums">{pct}%</span> : null}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
