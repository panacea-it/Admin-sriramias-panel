import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import ContentItemPreviewPanel from './ContentItemPreviewPanel'

export default function ContentItemPreviewModal({ open, onClose, category, row }) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (typeof document === 'undefined') return null

  const title =
    row?.classTitle ||
    row?.videoTitle ||
    row?.testName ||
    row?.assignmentTitle ||
    row?.pdfName ||
    row?.title ||
    'Content details'

  return createPortal(
    <AnimatePresence>
      {open && row && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center sm:p-4 md:p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="fixed inset-0 bg-slate-900/55 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="content-preview-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 16 }}
            transition={{ duration: 0.28, ease: [0.21, 1.02, 0.48, 1] }}
            className={cn(
              'relative flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/80',
              'sm:max-h-[92dvh] sm:w-[90vw] sm:max-w-[min(100%,900px)] sm:rounded-2xl',
            )}
          >
            <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-[#55ace7] via-[#5a7ba8] to-[#1a3a5c] px-5 py-4 sm:px-6">
              <h2
                id="content-preview-modal-title"
                className="truncate text-lg font-bold text-white sm:text-xl"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6">
              <ContentItemPreviewPanel category={category} row={row} onClose={onClose} embedded />
            </div>

            <div className="sticky bottom-0 z-10 flex shrink-0 justify-end border-t border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
