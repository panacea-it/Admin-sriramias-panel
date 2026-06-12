import { useEffect, useId, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusable(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
    // `offsetParent` is a pragmatic way to ignore display:none elements.
    return el instanceof HTMLElement && el.offsetParent !== null
  })
}

export default function AppModalWrapper({
  open,
  onClose,
  children,
  className,
  size = 'lg',
  title = 'Dialog',
  role = 'dialog',
  zIndex = 100,
  showCloseButton = true,
}) {
  const panelRef = useRef(null)
  const closeBtnRef = useRef(null)
  const lastActiveElementRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const titleId = useId()

  const sizes = useMemo(
    () => ({
      md: 'max-w-2xl',
      lg: 'max-w-4xl',
      xl: 'max-w-5xl',
      full: 'max-w-[min(100%,1180px)]',
    }),
    [],
  )

  useEffect(() => {
    if (!open) return undefined

    lastActiveElementRef.current = document.activeElement

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current?.()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)

      // Restore focus for better keyboard UX.
      const prev = lastActiveElementRef.current
      if (prev && typeof prev.focus === 'function') prev.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const panel = panelRef.current
    if (!panel) return undefined

    const t = requestAnimationFrame(() => {
      const focusables = getFocusable(panel)
      const preferred = closeBtnRef.current
      ;(preferred || focusables[0] || panel).focus?.()
    })

    return () => cancelAnimationFrame(t)
  }, [open])

  const handlePanelKeyDown = (e) => {
    if (e.key !== 'Tab') return
    const panel = panelRef.current
    if (!panel) return

    const focusables = getFocusable(panel)
    if (!focusables.length) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement

    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (active === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-6 sm:items-center',
      )}
      style={{ zIndex }}
      role={role}
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-md modal-backdrop-animate"
        onClick={() => onCloseRef.current?.()}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        className={cn(
          'relative z-[1] w-full outline-none max-h-[calc(100dvh-2rem)] overflow-y-auto',
          'modal-panel-animate',
          sizes[size] ?? sizes.lg,
          className,
        )}
      >
        <span id={titleId} className="sr-only">
          {title}
        </span>

        {showCloseButton === true && (
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => onCloseRef.current?.()}
            className={cn(
              'absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center',
              'rounded-lg border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm',
              'transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7] focus-visible:ring-offset-2',
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {children}
      </div>
    </div>,
    document.body,
  )
}

