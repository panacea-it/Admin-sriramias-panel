import { cn } from '../../../../utils/cn'
import { CBT_STATS_GRID_CLASS } from './cbtUiConstants'

export default function CbtStatsGrid({ children, columns = 3, className }) {
  const columnClass =
    columns === 4
      ? 'sm:grid-cols-2 xl:grid-cols-4'
      : columns === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-3'

  return (
    <div className={cn('grid gap-3 sm:gap-4', columnClass, className)}>{children}</div>
  )
}
