import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, X } from 'lucide-react'

export default function NotificationMessageModal({ open, message, onClose }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-message-title"
        >
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.article
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.28, ease: [0.21, 1.02, 0.48, 1] }}
            className="relative flex max-h-[min(88vh,560px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.2)] sm:max-w-xl"
          >
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-[#55ace7] to-[#246392] px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Bell className="h-5 w-5 text-white" strokeWidth={2.2} />
                </span>
                <h2
                  id="notification-message-title"
                  className="text-lg font-bold text-white sm:text-xl"
                >
                  Notification Message
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white shadow-sm transition hover:bg-white/25"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="rounded-xl border border-slate-100 bg-[#f8fbff]/80 px-4 py-4 sm:px-5 sm:py-5">
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-[#333] sm:text-base sm:leading-7">
                  {message}
                </p>
              </div>
            </div>

            <footer className="flex shrink-0 justify-end border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50"
              >
                Close
              </button>
            </footer>
          </motion.article>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
