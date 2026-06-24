import { cn } from '../../utils/cn'

export default function StatusBadge({ status }) {
  const active = status === 'Active'
  return (
    <span
      className={cn(
        'inline-flex min-w-[76px] items-center justify-center rounded-full px-3.5 py-1 text-xs font-semibold text-white sm:text-sm',
        active ? 'bg-[#69df66]' : 'bg-[#efb36d]',
      )}
    >
      {status || 'Active'}
    </span>
  )
}
