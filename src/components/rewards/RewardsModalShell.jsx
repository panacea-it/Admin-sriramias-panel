import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import {
  rewardsModalPrimaryBtnClass,
  rewardsModalSecondaryBtnClass,
  rewardsModalDangerBtnClass,
} from './rewardsModalUi'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusable(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el instanceof HTMLElement && el.offsetParent !== null,
  )
}

export default function RewardsModalShell({
  open,
  onClose,
  title,
  children,
  footer,
  description,
  zIndex = 110,
}) {
  const panelRef = useRef(null)
  const closeBtnRef = useRef(null)
  const lastActiveElementRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const titleId = useId()

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
      ;(closeBtnRef.current || focusables[0] || panel).focus?.()
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
    } else if (active === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center overflow-y-auto p-3 sm:p-4"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-slate-900/35 backdrop-blur-sm modal-backdrop-animate"
        onClick={() => onCloseRef.current?.()}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        className={cn(
          'relative z-[1] flex w-[94%] max-w-[560px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_48px_rgba(15,23,42,0.18)]',
          'modal-panel-animate max-h-[min(calc(100dvh-1.5rem),720px)]',
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0 pr-2">
            <h2 id={titleId} className="text-base font-bold text-slate-900 sm:text-lg">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
            )}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => onCloseRef.current?.()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/30"
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </header>
        <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

export function RewardsModalField({ label, error, hint, children, htmlFor }) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </label>
      )}
      {children}
      {error && <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function RewardsModalCancelButton({ onClick, disabled, children = 'Cancel' }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={rewardsModalSecondaryBtnClass}>
      {children}
    </button>
  )
}

export function RewardsModalPrimaryButton({
  type = 'button',
  form,
  onClick,
  disabled,
  loading,
  children,
}) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      className={rewardsModalPrimaryBtnClass}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait…
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function RewardsModalDangerButton({ onClick, disabled, loading, children }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading} className={rewardsModalDangerBtnClass}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait…
        </>
      ) : (
        children
      )}
    </button>
  )
}
