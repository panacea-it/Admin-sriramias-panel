import { cn } from '../../utils/cn'

/** Status pills — Current Affairs green / amber pattern */
const STYLES = {
  Scheduled: 'bg-[#55ace7] text-white',
  Live: 'bg-[#246392] text-white',
  Completed: 'bg-[#69df66] text-white',
  Active: 'bg-[#69df66] text-white',
  Disabled: 'bg-[#9ca0a8] text-white',
  Draft: 'bg-[#efb36d] text-white',
  'In Active': 'bg-[#efb36d] text-white',
}

export default function LiveClassStatusBadge({ status }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-[88px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold',
        STYLES[status] || 'bg-[#eef2fc] text-[#246392]',
      )}
    >
      {status}
    </span>
  )
}
