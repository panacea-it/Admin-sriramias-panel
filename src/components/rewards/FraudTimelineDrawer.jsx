import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { getFraudTimeline } from '../../services/rewardService'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast } from '@/utils/toast'

export default function FraudTimelineDrawer({ open, caseRow, onClose }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !caseRow?.id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const data = await getFraudTimeline(caseRow.id)
        if (!cancelled) setEvents(Array.isArray(data) ? data : [])
      } catch (error) {
        if (!cancelled) toast.error(getApiErrorMessage(error, 'Failed to load timeline'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [open, caseRow?.id])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && caseRow && (
        <>
          <motion.div className="fixed inset-0 z-[200] bg-slate-900/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            className="fixed inset-y-0 right-0 z-[201] w-full max-w-md bg-white shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-bold">{caseRow.studentName} — Activity</h2>
              <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              {loading ? (
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#246392]" />
              ) : (
                <ol className="space-y-4 border-l-2 border-violet-200 pl-4">
                  {events.map((ev, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-violet-500" />
                      <p className="text-sm font-bold text-slate-900">{ev.title}</p>
                      <p className="text-xs text-slate-500">{ev.detail}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatCategoryDateTime(ev.at)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
