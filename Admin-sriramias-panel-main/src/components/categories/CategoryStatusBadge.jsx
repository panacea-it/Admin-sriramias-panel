import { cn } from '../../utils/cn'

export default function CategoryStatusBadge({ status }) {
  const active = status === 'Active'
  const label = status === 'In Active' ? 'Inactive' : status
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
