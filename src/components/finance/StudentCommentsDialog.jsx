import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { FileText, MessageSquare, X } from 'lucide-react'
import { cn } from '../../utils/cn'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function getFocusable(container) {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el instanceof HTMLElement && el.offsetParent !== null,
  )
}

export default function StudentCommentsDialog({ open, onClose, studentName, comment }) {
  const panelRef = useRef(null)
  const closeBtnRef = useRef(null)
  const lastActiveElementRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const titleId = useId()

  const text = (comment || '').trim()
  const hasComment = text.length > 0

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
      ;(closeBtnRef.current || panel).focus?.()
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
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="fixed inset-0 bg-[rgba(0,0,0,0.45)] backdrop-blur-sm modal-backdrop-animate"
        onClick={() => onCloseRef.current?.()}
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        className={cn(
          'relative z-[1] w-[95%] max-w-[700px] rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.15)]',
          'modal-panel-animate sm:w-[85%]',
        )}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 shrink-0 text-[#4FA3D9]" strokeWidth={2} aria-hidden="true" />
              <h2 id={titleId} className="text-lg font-bold text-[#1a3a5c]">
                Student Comments
              </h2>
            </div>
            {studentName && (
              <p className="mt-1.5 pl-7 text-sm font-medium text-[#686868]">{studentName}</p>
            )}
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => onCloseRef.current?.()}
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              'border border-[#E5E7EB] bg-[#F8FAFC] text-[#686868]',
              'transition-all duration-200 hover:scale-105 hover:bg-[#EAF4FD] hover:text-[#246392]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FA3D9] focus-visible:ring-offset-2',
            )}
            aria-label="Close"
          >
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </header>

        <div className="mt-5">
          {hasComment ? (
            <div
              className={cn(
                'max-h-[350px] overflow-y-auto rounded-[10px] border-l-4 border-[#4FA3D9] bg-[#F8FAFC] p-4',
                'scrollbar-thin scrollbar-thumb-slate-300',
              )}
            >
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1a3a5c]">
                <MessageSquare className="h-4 w-4 text-[#4FA3D9]" strokeWidth={2} aria-hidden="true" />
                Comment
              </p>
              <p className="whitespace-pre-wrap break-words text-left text-[15px] leading-relaxed text-[#222] sm:text-base">
                {text}
              </p>
            </div>
          ) : (
            <div
              className="flex min-h-[120px] max-h-[350px] flex-col items-center justify-center gap-3 rounded-[10px] bg-[#F8FAFC] px-4 py-8 text-center"
            >
              <FileText className="h-10 w-10 text-slate-300" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm font-medium text-slate-500">No comments available</p>
            </div>
          )}
        </div>

        <footer className="mt-6 flex justify-end border-t border-[#E5E7EB] pt-5">
          <button
            type="button"
            onClick={() => onCloseRef.current?.()}
            className={cn(
              'rounded-lg bg-gradient-to-r from-[#4FA3D9] to-[#1F5E99] px-6 py-2.5',
              'text-sm font-semibold text-white shadow-sm',
              'transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:brightness-105',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4FA3D9] focus-visible:ring-offset-2',
            )}
          >
            Close
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
