import { AnimatePresence, motion } from 'framer-motion'
import { Ban, CheckCircle2, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { facultySubjectLabels } from '../../data/facultySubjectLabels'

export default function SubjectBulkToolbar({
  selectedCount = 0,
  onEnable,
  onDisable,
  onDelete: _onDelete,
  onClearSelection,
  className,
}) {
  const label = facultySubjectLabels.plural.toLowerCase()

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={cn('overflow-hidden', className)}
        >
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#55ace7]/25 bg-gradient-to-r from-[#eef2fc] to-[#f0f9ff] px-4 py-3 shadow-[0_4px_18px_rgba(85,172,231,0.14)]">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-[#1a3a5c]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#55ace7] text-[10px] font-bold text-white">
                ✓
              </span>
              {selectedCount} {label} selected
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onEnable}
                title="Activate"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-sm transition hover:scale-[1.02] hover:bg-emerald-50 hover:shadow active:scale-[0.98]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Activate Selected
              </button>
              <button
                type="button"
                onClick={onDisable}
                title="Deactivate"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3.5 py-2 text-xs font-semibold text-amber-700 shadow-sm transition hover:scale-[1.02] hover:bg-amber-50 hover:shadow active:scale-[0.98]"
              >
                <Ban className="h-3.5 w-3.5" />
                Deactivate Selected
              </button>
              <button
                type="button"
                onClick={onClearSelection}
                title="Clear selection"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <X className="h-3.5 w-3.5" />
                Clear Selection
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
