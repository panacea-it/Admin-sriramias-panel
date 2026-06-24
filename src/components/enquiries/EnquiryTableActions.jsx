import { Eye, Pencil } from 'lucide-react'
import { cn } from '../../utils/cn'

function ActionIconButton({ icon: Icon, label, onClick, variant = 'default' }) {
  const variants = {
    view: 'bg-[#eef6fc] text-[#246392] hover:bg-[#55ace7]/15 hover:text-[#1a3a5c]',
    edit: 'bg-slate-100 text-[#686868] hover:bg-slate-200 hover:text-[#1a3a5c]',
    default: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
  }

  return (
    <div className="group relative inline-flex shrink-0">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150',
          'hover:scale-105 active:scale-95',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40 focus-visible:ring-offset-1',
          variants[variant] || variants.default,
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </button>
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap',
          'rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-lg',
          'transition-all duration-200 group-hover:opacity-100 group-focus-within:opacity-100',
        )}
      >
        {label}
      </span>
    </div>
  )
}

export default function EnquiryTableActions({ onView, onEdit }) {
  return (
    <div
      className="flex flex-nowrap items-center justify-center gap-2.5 whitespace-nowrap sm:gap-3"
      role="group"
      aria-label="Enquiry row actions"
    >
      <ActionIconButton icon={Eye} label="View" onClick={onView} variant="view" />
      <ActionIconButton icon={Pencil} label="Edit" onClick={onEdit} variant="edit" />
    </div>
  )
}
