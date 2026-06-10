import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { useBodyScrollLock, useFocusTrap } from './useFocusTrap'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-5xl',
  '7xl': 'w-[min(95vw,80rem)] max-w-7xl',
}

/** Bookstore-only modal — solid panel, overlay, portal, a11y */
export default function BookstoreModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'lg',
  className,
  bodyClassName,
  loading = false,
  layer = 'default',
}) {
  const titleId = useId()
  const descId = useId()
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

  const zLayer = layer === 'elevated' ? 'z-[230]' : 'z-[220]'

  return createPortal(
    <div
      className={cn('bookstore-modal-root fixed inset-0 flex items-end justify-center sm:items-center', zLayer)}
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="bookstore-modal-backdrop fixed inset-0 bg-[#0f172a]/70 backdrop-blur-[6px]"
        onClick={onClose}
      />
      <div
        className="relative z-[1] flex w-full max-h-[100dvh] flex-col p-3 sm:max-h-[min(100dvh,100%)] sm:p-6"
        style={{ pointerEvents: 'none' }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={subtitle ? descId : undefined}
          tabIndex={-1}
          className={cn(
            'bookstore-modal-panel pointer-events-auto flex w-full flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.22)]',
            'max-h-[calc(100dvh-1.5rem)] sm:max-h-[min(90dvh,880px)]',
            SIZES[size] ?? SIZES.lg,
            'mx-auto',
            className,
          )}
          style={{ pointerEvents: 'auto' }}
        >
          <header className="sticky top-0 z-10 shrink-0 border-b border-[#eef0f4] bg-white px-5 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h2 id={titleId} className="text-lg font-bold tracking-tight text-[#111] sm:text-xl">
                  {title}
                </h2>
                {subtitle && (
                  <p id={descId} className="mt-1 text-sm text-[#686868]">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e8e8e8] bg-[#f7f7f9] text-[#555] transition hover:bg-[#eee] hover:text-[#111]"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
          </header>

          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5',
              loading && 'pointer-events-none opacity-60',
              bodyClassName,
            )}
          >
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-10 rounded-lg bg-[#f0f0f4]" />
                <div className="h-10 rounded-lg bg-[#f0f0f4]" />
                <div className="h-24 rounded-lg bg-[#f0f0f4]" />
              </div>
            ) : (
              children
            )}
          </div>

          {footer && (
            <footer className="sticky bottom-0 z-10 shrink-0 border-t border-[#eef0f4] bg-[#fafbfc] px-5 py-4 sm:px-6">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function BookstoreModalFooter({ children, className }) {
  return (
    <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3', className)}>
      {children}
    </div>
  )
}
