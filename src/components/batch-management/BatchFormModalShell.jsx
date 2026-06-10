import { X } from 'lucide-react'
import Modal from '../ui/Modal'
import { cn } from '../../utils/cn'

export default function BatchFormModalShell({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
  saving = false,
}) {
  return (
    <Modal open={open} onClose={onClose} size={size} title={title} showCloseButton={false}>
      <div className="flex max-h-[min(88vh,820px)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80">
        <div className="shrink-0 border-b border-slate-100 bg-[#f0f6fb] px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-[#1a3a5c] sm:text-xl">
                {title}
              </h2>
              {subtitle && (
                <p className="mt-1 text-sm text-[#686868]">{subtitle}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer && (
          <div
            className={cn(
              'sticky bottom-0 z-10 shrink-0 border-t border-slate-100',
              'bg-white/90 px-5 py-4 backdrop-blur-md sm:px-6',
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </Modal>
  )
}
