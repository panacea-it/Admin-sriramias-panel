import { AnimatePresence, motion } from 'framer-motion'
import { Trash2, Ban, CheckCircle2 } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function ContentBulkToolbar({
  selectedCount = 0,
  onDelete,
  onDisable,
  onEnable,
  showEnableDisable = true,
  className,
}) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={cn('overflow-hidden', className)}
        >
          <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-[#55ace7]/25 bg-gradient-to-r from-[#eef2fc] to-[#f0f9ff] px-4 py-3 shadow-[0_4px_16px_rgba(85,172,231,0.12)]">
            <span className="text-sm font-bold text-[#1a3a5c]">
              {selectedCount} Selected
            </span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {showEnableDisable && (
                <>
                  <button
                    type="button"
                    onClick={onEnable}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 hover:shadow"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Enable
                  </button>
                  <button
                    type="button"
                    onClick={onDisable}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm transition hover:bg-amber-50 hover:shadow"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    Disable
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#c96565] shadow-sm transition hover:bg-red-50 hover:shadow"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
