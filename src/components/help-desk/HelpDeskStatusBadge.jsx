import { cn } from '../../utils/cn'

/** Fixed width so Replied / Not Replied align identically in the table */
const BADGE_WIDTH = 'w-[7.75rem]'

export default function HelpDeskStatusBadge({ status, className }) {
  const replied = status === 'Replied'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-semibold leading-none text-white',
        BADGE_WIDTH,
        replied ? 'bg-[#69df66]' : 'bg-[#ef4444]',
        className,
      )}
    >
      {status}
    </span>
  )
}
