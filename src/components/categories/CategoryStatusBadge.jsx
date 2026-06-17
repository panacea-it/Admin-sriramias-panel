import { cn } from '../../utils/cn'
import {
  formatCategoryStatusDisplayLabel,
  isCategoryStatusActive,
} from '../../utils/categoryStatusHelpers'

export default function CategoryStatusBadge({ status }) {
  const active = isCategoryStatusActive(status)
  const label = formatCategoryStatusDisplayLabel(status)

  return (
    <span
      className={cn(
        'inline-flex min-w-[88px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white',
        active ? 'bg-[#69df66]' : 'bg-[#efb36d]',
      )}
    >
      {label}
    </span>
  )
}
