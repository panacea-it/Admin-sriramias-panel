import { motion } from 'framer-motion'
import { Save, RotateCcw, Download, ScrollText } from 'lucide-react'
import { toast } from '@/utils/toast'

export default function StickyFooter({ onResetPermissions, onSave }) {
  return (
    <motion.footer
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/85 px-4 py-3 shadow-[0_-8px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl lg:left-[260px]"
    >
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between gap-3">
        <p className="hidden text-xs text-slate-500 sm:block">
          Unsaved permission changes apply after you save
        </p>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => {
              onResetPermissions?.()
              toast.message('Permissions reset to defaults')
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Permissions
          </button>
          <button
            type="button"
            onClick={() => toast.success('Roles exported', { description: 'CSV download started' })}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export Roles
          </button>
          <button
            type="button"
            onClick={() => toast.info('Opening audit logs')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ScrollText className="h-4 w-4" />
            Audit Logs
          </button>
          <button
            type="button"
            onClick={() => {
              onSave?.()
              toast.success('All changes saved')
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:shadow-violet-500/45"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </div>
    </motion.footer>
  )
}
