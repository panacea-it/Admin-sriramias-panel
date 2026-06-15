import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Responsive row actions: inline on md+, dropdown on mobile.
 * @param {{ label: string, icon?: React.ComponentType, onClick: () => void, variant?: 'default'|'danger'|'accent', show?: boolean, ariaLabel?: string }[]} actions
 */
export default function FinanceActionMenu({
  actions = [],
  className,
  inlineFrom = 'md',
  menuLabel = 'Row actions',
  buttonVariant = 'default',
}) {
  const visible = actions.filter((a) => a.show !== false)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  if (!visible.length) return null

  const variantClass = {
    default: 'text-[#246392] hover:bg-[#eef6fc]',
    accent: 'text-[#d97706] hover:bg-amber-50',
    danger: 'text-[#df8284] hover:bg-red-50',
  }

  const buttonShellClass =
    buttonVariant === 'crm'
      ? 'border border-[#E5E7EB] bg-white text-[#246392] hover:border-[#1F5E99] hover:bg-[#1F5E99] hover:text-white hover:shadow-md'
      : ''

  const inlineCls = inlineFrom === 'sm' ? 'hidden sm:flex' : inlineFrom === 'lg' ? 'hidden lg:flex' : 'hidden md:flex'
  const menuCls = inlineFrom === 'sm' ? 'sm:hidden' : inlineFrom === 'lg' ? 'lg:hidden' : 'md:hidden'

  return (
    <div ref={ref} className={cn('relative', className)}>
      <div className={cn('flex flex-nowrap items-center justify-center gap-[10px]', inlineCls)}>
        {visible.map((a) => {
          const Icon = a.icon
          return (
            <button
              key={a.label}
              type="button"
              onClick={a.onClick}
              title={a.label}
              aria-label={a.ariaLabel || a.label}
              className={cn(
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200',
                buttonVariant === 'crm' ? 'hover:scale-105' : 'hover:scale-110 hover:shadow-sm',
                buttonShellClass,
                buttonVariant !== 'crm' && variantClass[a.variant || 'default'],
              )}
            >
              {Icon ? <Icon className="h-4 w-4" strokeWidth={2} /> : <span className="text-xs font-semibold">{a.label[0]}</span>}
            </button>
          )
        })}
      </div>

      <div className={menuCls}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={menuLabel}
          aria-expanded={open}
          aria-haspopup="menu"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-[#246392] shadow-sm hover:bg-[#eef6fc]"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
        {open && (
          <div
            role="menu"
            className="absolute right-0 z-30 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg"
          >
            {visible.map((a) => {
              const Icon = a.icon
              return (
                <button
                  key={a.label}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false)
                    a.onClick()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-slate-50',
                    a.variant === 'danger' && 'text-[#df8284]',
                    a.variant === 'accent' && 'text-[#d97706]',
                    (!a.variant || a.variant === 'default') && 'text-[#222]',
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />}
                  {a.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
