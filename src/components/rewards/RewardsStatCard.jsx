import { cn } from '../../utils/cn'

export default function RewardsStatCard({ icon: Icon, label, value, subValue, className, tone = 'default' }) {
  const tones = {
    default: 'from-[#55ace7] to-[#246392]',
    warning: 'from-amber-500 to-orange-500',
    danger: 'from-rose-500 to-red-600',
    success: 'from-emerald-500 to-teal-600',
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <div className={cn('flex items-center gap-3 bg-gradient-to-r px-4 py-3 text-white', tones[tone] || tones.default)}>
        {Icon && <Icon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2.2} />}
        <p className="text-sm font-semibold">{label}</p>
      </div>
      <div className="px-4 py-4">
        <p className="text-2xl font-bold text-[#1a3a5c]">{value}</p>
        {subValue && <p className="mt-1 text-xs font-medium text-[#686868]">{subValue}</p>}
      </div>
    </div>
  )
}
