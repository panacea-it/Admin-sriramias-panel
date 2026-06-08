import { PlusCircle } from 'lucide-react'
import { cn } from '../../utils/cn'

export function BannerButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 min-h-[38px] items-center justify-center gap-2 rounded-lg bg-[#1a3a5c] px-4 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition hover:bg-[#152f4a] sm:text-base"
    >
      <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      {children}
    </button>
  )
}

const STATUS_STYLES = {
  Active: 'bg-[#69df66]',
  Inactive: 'bg-[#ef4444]',
  Scheduled: 'bg-[#55ace7]',
  Completed: 'bg-[#9ca3af]',
  'In Active': 'bg-[#ef4444]',
}

export function StatusBadge({ status }) {
  const normalized = status === 'In Active' ? 'Inactive' : status
  return (
    <span
      className={cn(
        'inline-flex min-w-[88px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-semibold text-white',
        STATUS_STYLES[normalized] || 'bg-[#efb36d]',
      )}
    >
      {normalized}
    </span>
  )
}

export function ResourceNameCell({ name }) {
  return <span className="truncate font-medium">{name}</span>
}
