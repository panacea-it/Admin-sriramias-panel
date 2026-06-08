import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { contentLibraryTw } from '../../constants/contentLibraryTheme'

export default function ContentStatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(contentLibraryTw.card, 'p-5')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#1a3a5c]">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        {Icon && (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
            style={{ background: accent || '#55ace7' }}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
        )}
      </div>
    </motion.div>
  )
}
