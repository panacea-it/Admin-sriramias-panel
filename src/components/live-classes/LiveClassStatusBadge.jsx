import { cn } from '../../utils/cn'
import { displayRecordStatusLabel } from '../../constants/recordStatus'

/** Status pills — Current Affairs green / amber pattern */
const STYLES = {
  Scheduled: 'bg-[#55ace7] text-white',
  Live: 'bg-[#246392] text-white',
  Completed: 'bg-[#69df66] text-white',
  Active: 'bg-[#69df66] text-white',
  Deactivated: 'bg-[#efb36d] text-white',
  Disabled: 'bg-[#efb36d] text-white',
  Draft: 'bg-[#efb36d] text-white',
  'In Active': 'bg-[#efb36d] text-white',
}

export default function LiveClassStatusBadge({ status }) {
  const label = displayRecordStatusLabel(status)
  const tone =
    label === 'Active' || label === 'Deactivated'
      ? label
      : status === 'Disabled'
        ? 'Deactivated'
        : status

  return (
    <span
      className={cn(
        'inline-flex min-w-[88px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold',
        STYLES[tone] || STYLES[status] || 'bg-[#eef2fc] text-[#246392]',
      )}
    >
      {label === 'Active' || label === 'Deactivated' ? label : status}
    </span>
  )
}
