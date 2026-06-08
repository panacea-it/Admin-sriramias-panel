import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { useBodyScrollLock, useFocusTrap } from './useFocusTrap'

export default function BookstoreDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-md',
}) {
  const titleId = useId()
  const panelRef = useRef(null)

  useBodyScrollLock(open)
  useFocusTrap(panelRef, open)

  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="bookstore-modal-root fixed inset-0 z-[210] flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Close panel"
        className="bookstore-modal-backdrop fixed inset-0 bg-[#0f172a]/70 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'bookstore-drawer-panel relative z-[1] flex h-full w-full flex-col border-l border-[#e5e7eb] bg-white shadow-[-12px_0_48px_rgba(15,23,42,0.18)]',
          width,
        )}
      >
        <header className="sticky top-0 z-10 shrink-0 border-b border-[#eef0f4] bg-gradient-to-r from-[#4a3d8f] to-[#7c5cbf] px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-bold">
                {title}
              </h2>
              {subtitle && <p className="mt-0.5 text-sm text-white/85">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
              aria-label="Close panel"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-white p-5">{children}</div>
        {footer && (
          <footer className="sticky bottom-0 shrink-0 border-t border-[#eef0f4] bg-[#fafbfc] p-4">
            {footer}
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  )
}
