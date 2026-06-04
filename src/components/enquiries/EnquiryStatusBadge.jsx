import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'

export const ENQUIRY_STATUS = {
  OPENED: 'Opened',
  UNOPENED: 'Unopened',
}

const STATUS_META = {
  [ENQUIRY_STATUS.OPENED]: {
    tooltip: 'Enquiry Contacted',
    toast: 'Enquiry marked as Opened',
    badgeClass:
      'bg-[#22c55e] shadow-[0_4px_14px_rgba(34,197,94,0.35)] hover:bg-[#16a34a] hover:shadow-[0_6px_18px_rgba(34,197,94,0.45)]',
  },
  [ENQUIRY_STATUS.UNOPENED]: {
    tooltip: 'Pending Follow-up',
    toast: 'Enquiry marked as Unopened',
    badgeClass:
      'bg-[#f97316] shadow-[0_4px_14px_rgba(249,115,22,0.35)] hover:bg-[#ea580c] hover:shadow-[0_6px_18px_rgba(249,115,22,0.45)] motion-safe:animate-pulse',
  },
}

/** Toggle helper — ready for future API integration */
export function getNextEnquiryStatus(current) {
  return current === ENQUIRY_STATUS.OPENED
    ? ENQUIRY_STATUS.UNOPENED
    : ENQUIRY_STATUS.OPENED
}

export default function EnquiryStatusBadge({ status, onStatusChange }) {
  const meta = STATUS_META[status] ?? STATUS_META[ENQUIRY_STATUS.UNOPENED]

  const handleClick = () => {
    const next = getNextEnquiryStatus(status)
    onStatusChange?.(next)
    toast.success(STATUS_META[next].toast)
  }

  return (
    <div className="group relative inline-flex justify-center">
      <button
        type="button"
        onClick={handleClick}
        title={meta.tooltip}
        aria-label={`${status}. ${meta.tooltip}. Click to change status.`}
        className={cn(
          'relative inline-flex min-w-[96px] cursor-pointer items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold text-white',
          'transition-all duration-200 ease-out hover:scale-105 active:scale-95',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#246392]',
          meta.badgeClass,
        )}
      >
        {status}
      </button>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap',
          'rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg',
          'transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100',
          'after:absolute after:left-1/2 after:top-full after:h-0 after:w-0 after:-translate-x-1/2 after:border-x-[5px] after:border-t-[6px] after:border-x-transparent after:border-t-slate-900',
        )}
      >
        {meta.tooltip}
      </span>
    </div>
  )
}
