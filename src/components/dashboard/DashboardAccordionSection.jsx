import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function DashboardAccordionSection({
  icon: Icon,
  title,
  isOpen,
  onToggle,
  action,
  children,
  className,
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(0,0,0,0.06)]',
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[#fafcff] sm:px-6"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1fa2ff]/20 to-[#ef8b8b]/20 ring-1 ring-[#1fa2ff]/10">
            <Icon size={18} className="text-[#655ed3]" strokeWidth={2.2} />
          </div>
          <h2 className="bg-gradient-to-r from-[#1fa2ff] to-[#ef8b8b] bg-clip-text text-base font-black uppercase tracking-wide text-transparent sm:text-lg">
            {title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {action ? (
            <span
              className="hidden sm:inline"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
              {action}
            </span>
          ) : null}
          {isOpen ? (
            <ChevronDown
              className="h-5 w-5 shrink-0 text-[#655ed3] transition-transform duration-300"
              strokeWidth={2.5}
              aria-hidden
            />
          ) : (
            <ChevronRight
              className="h-5 w-5 shrink-0 text-[#655ed3] transition-transform duration-300"
              strokeWidth={2.5}
              aria-hidden
            />
          )}
        </div>
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={cn(
              'border-t border-[#eef2fc] px-5 pb-5 pt-4 transition-opacity duration-300 sm:px-6 sm:pb-6',
              isOpen ? 'opacity-100' : 'opacity-0',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
