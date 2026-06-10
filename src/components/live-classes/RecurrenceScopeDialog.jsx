import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function RecurrenceScopeDialog({
  open,
  mode = 'edit',
  title,
  lessonName,
  scopes,
  onConfirm,
  onCancel,
  loading = false,
}) {
  const [scope, setScope] = useState(scopes[0]?.value ?? 'this')

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
          />
          <motion.div
            role="dialog"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-[#eef6fc] to-white px-6 py-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#55ace7]/15 text-[#246392]">
                  <CalendarClock className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-[#111]">{title}</h3>
                  <p className="mt-1 text-sm text-[#686868]">
                    <span className="font-semibold text-[#222]">{lessonName}</span> is part of a
                    recurring series. Choose how {mode === 'delete' ? 'deletion' : 'changes'} should
                    apply.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 px-6 py-4">
              {scopes.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition',
                    scope === opt.value
                      ? 'border-[#55ace7] bg-[#eef6fc] ring-2 ring-[#55ace7]/25'
                      : 'border-slate-200 hover:border-[#55ace7]/40',
                  )}
                >
                  <input
                    type="radio"
                    name="recurrence-scope"
                    value={opt.value}
                    checked={scope === opt.value}
                    onChange={() => setScope(opt.value)}
                    className="mt-1 accent-[#246392]"
                  />
                  <span>
                    <span className="block text-sm font-bold text-[#111]">{opt.label}</span>
                    <span className="mt-0.5 block text-xs text-[#686868]">{opt.description}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="h-10 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-[#444] hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onConfirm(scope)}
                disabled={loading}
                className={cn(
                  'h-10 rounded-xl px-6 text-sm font-semibold text-white shadow-md disabled:opacity-60',
                  mode === 'delete'
                    ? 'bg-gradient-to-r from-rose-600 to-orange-500'
                    : 'bg-gradient-to-r from-[#1a3a5c] to-[#03045e]',
                )}
              >
                {loading ? 'Applying…' : 'Continue'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
