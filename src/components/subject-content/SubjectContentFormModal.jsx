import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { CATEGORY_TYPES } from '../../utils/facultySubjectHierarchy'

const MODAL_TITLES = {
  [CATEGORY_TYPES.LIVE_CLASS]: { add: 'Add Live Class', edit: 'Edit Live Class' },
  [CATEGORY_TYPES.RECORDED_CLASS]: { add: 'Add Recording', edit: 'Edit Recording' },
  [CATEGORY_TYPES.TEST_SERIES]: { add: 'Add Prelims Test', edit: 'Edit Prelims Test' },
  [CATEGORY_TYPES.PDFS]: { add: 'Add PDF', edit: 'Edit PDF' },
  [CATEGORY_TYPES.MAINS_ANSWER_WRITING]: {
    add: 'Add Mains Answer Writing',
    edit: 'Edit Mains Answer Writing',
  },
}

export function getContentModalTitle(categoryType, isEdit) {
  const titles = MODAL_TITLES[categoryType] || { add: 'Add Item', edit: 'Edit Item' }
  return isEdit ? titles.edit : titles.add
}

export default function SubjectContentFormModal({
  open,
  onClose,
  title,
  children,
  onSave,
  saving = false,
  saveLabel = 'Save',
}) {
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose?.()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose, saving])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[125] flex items-end justify-center sm:items-center sm:p-4 md:p-6">
          <motion.button
            type="button"
            aria-label="Close dialog"
            className="fixed inset-0 bg-slate-900/55 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => {
              if (!saving) onClose?.()
            }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="content-form-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 16 }}
            transition={{ duration: 0.28, ease: [0.21, 1.02, 0.48, 1] }}
            className={cn(
              'relative flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/80',
              'sm:max-h-[92dvh] sm:w-[90vw] sm:max-w-[min(100%,1400px)] sm:rounded-2xl',
              'lg:w-[85vw]',
            )}
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white px-5 py-4 sm:px-6">
              <h2
                id="content-form-modal-title"
                className="text-lg font-bold text-[#1a3a5c] sm:text-xl"
              >
                {title}
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (!saving) onClose?.()
                }}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-[#1a3a5c] disabled:opacity-60"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] px-4 py-4 sm:px-6 sm:py-5">
              {children}
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-end gap-3 border-t border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-sm sm:px-6">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="inline-flex h-11 min-w-[100px] items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="inline-flex h-11 min-w-[100px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.3)] transition hover:opacity-90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? 'Saving…' : saveLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
