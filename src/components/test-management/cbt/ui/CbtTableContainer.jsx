import { cn } from '../../../../utils/cn'
import { CBT_TABLE_CONTAINER_CLASS, CBT_TABLE_SCROLL_CLASS } from './cbtUiConstants'

export default function CbtTableContainer({
  children,
  scrollable = false,
  className,
  innerClassName,
}) {
  return (
    <div className={cn(CBT_TABLE_CONTAINER_CLASS, scrollable && CBT_TABLE_SCROLL_CLASS, className)}>
      <div className={innerClassName}>{children}</div>
    </div>
  )
}
