import { cn } from '../../utils/cn'

export default function ProgressBar({ value, className }) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0))
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#55ace7] to-[#246392] transition-all duration-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs font-semibold text-[#444]">{clamped}%</span>
    </div>
  )
}
