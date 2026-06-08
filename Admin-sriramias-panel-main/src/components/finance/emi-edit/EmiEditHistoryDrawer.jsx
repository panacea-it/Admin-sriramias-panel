import { AnimatePresence, motion } from 'framer-motion'
import { History, X } from 'lucide-react'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

export default function EmiEditHistoryDrawer({ open, onClose, planHistory = [], installmentHistory = [] }) {
  const combined = [
    ...(planHistory || []).map((h) => ({ ...h, scope: 'Plan' })),
    ...(installmentHistory || []).map((h) => ({ ...h, scope: h.installmentNo ? `EMI #${h.installmentNo}` : 'Installment' })),
  ].sort((a, b) => new Date(b.at) - new Date(a.at))

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close history"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-900/30"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 z-[121] flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#111]">
                <History className="h-4 w-4 text-[#246392]" />
                EMI audit history
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {combined.length === 0 ? (
                <p className="text-center text-sm text-[#686868]">No history recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {combined.map((entry, i) => (
                    <li
                      key={`${entry.at}-${i}`}
                      className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5 text-sm"
                    >
                      <p className="font-semibold text-[#222]">{entry.action}</p>
                      <p className="mt-1 text-xs text-[#686868]">
                        {entry.scope} · {entry.by || 'System'} ·{' '}
                        {formatCategoryDateTime(entry.at)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
