import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CornerUpRight, Mail, Phone, User, X } from 'lucide-react'

export default function HelpDeskReplyPanel({
  ticket,
  open,
  replyText,
  onReplyChange,
  onClose,
  onSend,
  sending = false,
}) {
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
          aria-labelledby="help-desk-reply-title"
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
            className="relative flex max-h-[min(92vh,720px)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_48px_-12px_rgba(15,23,42,0.2)]"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 bg-gradient-to-r from-[#55ace7] via-[#6baee0] to-[#3d8fd4] px-5 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                  <CornerUpRight className="h-5 w-5 text-[#55ace7]" strokeWidth={2.4} />
                </span>
                <div className="min-w-0">
                  <h2 id="help-desk-reply-title" className="text-lg font-bold text-white sm:text-xl">
                    Reply to Ticket
                  </h2>
                  <p className="mt-0.5 text-sm font-medium text-white/85">Ticket #{ticket.id}</p>
                </div>
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

            <div className="custom-scrollbar flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              <div className="rounded-xl border border-slate-100 bg-slate-50/90 p-4 sm:p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#9ca0a8]">
                  Ticket Details
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5 text-sm">
                    <User className="h-4 w-4 shrink-0 text-[#55ace7]" />
                    <span className="font-semibold text-[#111]">{ticket.userName}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-[#686868]">
                    <Mail className="h-4 w-4 shrink-0 text-[#9ca0a8]" />
                    <span>{ticket.email}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-[#686868]">
                    <Phone className="h-4 w-4 shrink-0 text-[#9ca0a8]" />
                    <span>{ticket.mobile}</span>
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-200/80 pt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#9ca0a8]">
                    Description
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#444] sm:text-base sm:leading-7">
                    {ticket.description}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="help-desk-reply"
                  className="mb-2 block text-sm font-semibold text-[#111]"
                >
                  Your Reply
                </label>
                <textarea
                  id="help-desk-reply"
                  value={replyText}
                  onChange={(e) => onReplyChange(e.target.value)}
                  rows={5}
                  placeholder="Write your reply to the student..."
                  className="w-full resize-y rounded-xl border border-slate-200/80 bg-[#eef6fc]/80 px-4 py-3.5 text-sm text-[#111] outline-none transition placeholder:text-[#9ca0a8] focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-[#55ace7]/25 sm:text-base"
                />
              </div>
            </div>

            <footer className="flex shrink-0 flex-wrap justify-end gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
              <button
                type="button"
                onClick={onClose}
                disabled={sending}
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSend}
                disabled={sending || !replyText.trim()}
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send Reply'}
              </button>
            </footer>
          </motion.article>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
