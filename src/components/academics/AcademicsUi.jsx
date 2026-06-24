import { PlusCircle } from 'lucide-react'
import { cn } from '../../utils/cn'
import { displayRecordStatusLabel } from '../../constants/recordStatus'

export function BannerButton({ children, onClick, showPlusIcon = true, className, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-10 min-h-[38px] items-center justify-center gap-2 rounded-lg bg-[#1a3a5c] px-4 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition hover:bg-[#152f4a] sm:text-base',
        className,
      )}
      {...rest}
    >
      {showPlusIcon && <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />}
      {children}
    </button>
  )
}

const STATUS_STYLES = {
  Active: 'bg-[#69df66]',
  Deactivated: 'bg-[#efb36d]',
  Scheduled: 'bg-[#55ace7]',
  Completed: 'bg-[#9ca3af]',
  Published: 'bg-[#10b981]',
  Unpublished: 'bg-[#efb36d]',
}

export function StatusBadge({ status }) {
  const label = displayRecordStatusLabel(status)
  const tone =
    label === 'Active' ? 'Active' : label === 'Deactivated' ? 'Deactivated' : status
  return (
    <span
      className={cn(
        'inline-flex min-w-[88px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white',
        STATUS_STYLES[tone] || STATUS_STYLES[status] || 'bg-[#efb36d]',
      )}
    >
      {label === 'Deactivated' || label === 'Active' ? label : status}
    </span>
  )
}

export function ResourceNameCell({ name }) {
  return <span className="truncate font-medium">{name}</span>
}
