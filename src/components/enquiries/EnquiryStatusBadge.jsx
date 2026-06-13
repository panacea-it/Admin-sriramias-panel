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
      'bg-gradient-to-r from-[#22c55e] to-[#16a34a] shadow-[0_3px_10px_rgba(34,197,94,0.35)] hover:from-[#16a34a] hover:to-[#15803d] hover:shadow-[0_5px_14px_rgba(34,197,94,0.45)]',
  },
  [ENQUIRY_STATUS.UNOPENED]: {
    tooltip: 'Pending Follow-up',
    toast: 'Enquiry marked as Unopened',
    badgeClass:
      'bg-gradient-to-r from-[#f97316] to-[#ea580c] shadow-[0_3px_10px_rgba(249,115,22,0.35)] hover:from-[#ea580c] hover:to-[#c2410c] hover:shadow-[0_5px_14px_rgba(249,115,22,0.45)]',
  },
}

/** Toggle helper — ready for future API integration */
export function getNextEnquiryStatus(current) {
  return current === ENQUIRY_STATUS.OPENED
    ? ENQUIRY_STATUS.UNOPENED
    : ENQUIRY_STATUS.OPENED
}

export default function EnquiryStatusBadge({ status, onStatusChange, compact = false }) {
  const meta = STATUS_META[status] ?? STATUS_META[ENQUIRY_STATUS.UNOPENED]

  const handleClick = () => {
    const next = getNextEnquiryStatus(status)
    onStatusChange?.(next)
    toast.success(STATUS_META[next].toast)
  }

  return (
    <div className="group relative inline-flex shrink-0 justify-center">
      <button
        type="button"
        onClick={handleClick}
        title={meta.tooltip}
        aria-label={`${status}. ${meta.tooltip}. Click to change status.`}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full font-semibold text-white whitespace-nowrap',
          'transition-all duration-200 ease-out hover:scale-105 active:scale-95',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#246392]',
          compact
            ? 'h-7 w-[84px] text-[11px] leading-none'
            : 'h-8 min-w-[96px] px-4 text-sm',
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
