import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Hash, User, X } from 'lucide-react'
import HelpDeskStatusBadge from './HelpDeskStatusBadge'

export default function HelpDeskDescriptionModal({ ticket, open, onClose }) {
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
      {open && ticket && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-desk-message-title"
        >
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-md"
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
            className="relative flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/95 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.2)] backdrop-blur-xl sm:max-w-xl"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-[#f8fbff] to-white px-5 py-4 sm:px-6">
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#55ace7]">
                  Ticket #{ticket.id}
                </p>
                <h2
                  id="help-desk-message-title"
                  className="text-lg font-bold leading-snug text-[#111] sm:text-xl"
                >
                  {ticket.subject}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-[#686868]">
                  <User className="h-4 w-4 shrink-0 text-[#55ace7]" />
                  <span className="font-semibold text-[#111]">{ticket.userName}</span>
                </div>
                <HelpDeskStatusBadge status={ticket.status} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50/90 px-3 py-2.5 text-sm text-[#686868]">
                  <Hash className="h-4 w-4 shrink-0 text-[#9ca0a8]" />
                  <span>
                    {ticket.email}
                    <span className="mx-1 text-[#cbd5e1]">·</span>
                    {ticket.mobile}
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50/90 px-3 py-2.5 text-sm text-[#686868]">
                  <Calendar className="h-4 w-4 shrink-0 text-[#9ca0a8]" />
                  <span>
                    {ticket.time}, {ticket.date}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9ca0a8]">
                  Full message
                </h3>
                <div className="rounded-xl border border-slate-100 bg-[#f8fbff]/80 px-4 py-4 sm:px-5 sm:py-5">
                  <p className="whitespace-pre-wrap text-base leading-relaxed text-[#333] sm:text-[17px] sm:leading-8">
                    {ticket.description}
                  </p>
                </div>
              </div>
            </div>
          </motion.article>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
