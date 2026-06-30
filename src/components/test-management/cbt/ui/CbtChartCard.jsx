import { cn } from '../../../../utils/cn'
import { CBT_CHART_CARD_CLASS } from './cbtUiConstants'

export default function CbtChartCard({ title, icon: Icon, children, className, bodyClassName }) {
  return (
    <article className={cn(CBT_CHART_CARD_CLASS, className)}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#1a3a5c] sm:text-base">
        {Icon ? <Icon className="h-4 w-4 shrink-0 text-[#55ace7]" /> : null}
        {title}
      </h3>
      <div className={bodyClassName}>{children}</div>
    </article>
  )
}
