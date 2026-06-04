import { cn } from '../../utils/cn'

export default function FinanceSectionHeader({ title, subtitle, actions, className }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-2', className)}>
      <div>
        <h3 className="text-sm font-bold text-[#246392] sm:text-base">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs font-medium text-[#686868]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
