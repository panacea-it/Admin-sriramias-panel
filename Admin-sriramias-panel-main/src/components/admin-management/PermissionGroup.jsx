import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import AdminCheckbox from './ui/AdminCheckbox'
import {
  emptyPermissionSet,
  fullPermissionSet,
  isFeaturePermissionActive,
  normalizeFeaturePermissions,
} from '../../utils/rbacPermissionModel'

/** Feature rows with permission checkboxes. */
export default function PermissionGroup({
  definitions,
  featureMap,
  onFeatureBulkChange,
  searchQuery,
  editable = true,
}) {
  const q = searchQuery.trim().toLowerCase()
  const items = (Array.isArray(definitions) ? definitions : []).filter(
    (d) => !q || d.label.toLowerCase().includes(q) || d.id.toLowerCase().includes(q),
  )

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
        No features match your search.
      </p>
    )
  }

  return (
    <motion.div className="space-y-2">
      {items.map((def, idx) => {
        const perms = normalizeFeaturePermissions(featureMap?.[def.id])
        const on = isFeaturePermissionActive(perms)

        return (
          <motion.div
            key={def.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.02, 0.2) }}
            className={cn(
              'flex items-center justify-between gap-4 rounded-xl border border-slate-200/75 bg-white/90 px-4 py-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition',
              editable &&
                'hover:border-violet-200/80 hover:shadow-[0_4px_14px_rgba(124,58,237,0.08)]',
            )}
          >
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-slate-900">{def.label}</p>
              <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
                Feature
              </p>
            </div>
            <AdminCheckbox
              id={`perm-${def.id}`}
              checked={on}
              disabled={!editable}
              aria-label={`${def.label} permission`}
              onChange={(enabled) =>
                onFeatureBulkChange(def.id, enabled ? fullPermissionSet() : emptyPermissionSet())
              }
            />
          </motion.div>
        )
      })}
    </motion.div>
  )
}
