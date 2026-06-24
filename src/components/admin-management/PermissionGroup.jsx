import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import PermissionToggle from './PermissionToggle'
import {
  collectLeafIds,
  emptyPermissionSet,
  fullPermissionSet,
  isFeaturePermissionActive,
  normalizeFeaturePermissions,
} from '../../utils/rbacPermissionModel'

function matchesSearch(def, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  if (def.label.toLowerCase().includes(q) || def.id.toLowerCase().includes(q)) return true
  if (def.children?.length) {
    return def.children.some((child) => matchesSearch(child, q))
  }
  return false
}

function groupAllowedState(children, featureMap) {
  const leafIds = collectLeafIds(children)
  if (!leafIds.length) return false
  return leafIds.every((id) => isFeaturePermissionActive(featureMap?.[id]))
}

function PermissionColumnHeader() {
  return (
    <div className="sticky top-0 z-20 mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 rounded-xl border border-slate-200/70 bg-slate-50 px-5 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        Feature / Module
      </span>
      <span className="min-w-[96px] text-right text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        Access
      </span>
    </div>
  )
}

function FeatureRow({ def, featureMap, onFeatureBulkChange, editable, depth = 0 }) {
  const perms = normalizeFeaturePermissions(featureMap?.[def.id])
  const on = isFeaturePermissionActive(perms)

  return (
    <div
      className={cn(
        'grid min-h-[56px] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 rounded-xl border border-slate-200/70 bg-white px-5 py-4 transition-colors duration-200',
        editable && 'hover:border-violet-200/80 hover:bg-violet-50/20',
        depth > 0 && 'ml-4 border-l-[3px] border-l-violet-100',
      )}
    >
      <div className="min-w-0 pr-2">
        <p className="text-[15px] font-semibold leading-snug text-slate-900">{def.label}</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Feature
        </p>
      </div>
      <div className="flex shrink-0 justify-end">
        <PermissionToggle
          allowed={on}
          disabled={!editable}
          size="md"
          onChange={(enabled) =>
            onFeatureBulkChange(def.id, enabled ? fullPermissionSet() : emptyPermissionSet())
          }
        />
      </div>
    </div>
  )
}

function FeatureGroup({
  def,
  featureMap,
  onFeatureBulkChange,
  onGroupBulkChange,
  editable,
  searchQuery,
  defaultExpanded = true,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const children = def.children || []
  const parentAllowed = groupAllowedState(children, featureMap)
  const hasChildren = children.length > 0

  const visibleChildren = useMemo(
    () => children.filter((child) => matchesSearch(child, searchQuery)),
    [children, searchQuery],
  )

  if (!matchesSearch(def, searchQuery)) return null

  if (!hasChildren) {
    return (
      <FeatureRow
        def={def}
        featureMap={featureMap}
        onFeatureBulkChange={onFeatureBulkChange}
        editable={editable}
      />
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-50/50 shadow-[0_1px_4px_rgba(15,23,42,0.04)]">
      <div
        className={cn(
          'grid min-h-[60px] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 border-b border-slate-200/60 px-5 py-4 transition-colors duration-200',
          editable && 'hover:bg-violet-50/25',
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-bold leading-snug text-slate-900">{def.label}</p>
            <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Module group · {children.length} features
            </p>
          </div>
        </button>
        <div className="flex shrink-0 justify-end">
          <PermissionToggle
            allowed={parentAllowed}
            disabled={!editable}
            onChange={(enabled) => onGroupBulkChange(children, enabled)}
          />
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && visibleChildren.length > 0 ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-2.5 bg-white/70 px-4 py-4"
          >
            {visibleChildren.map((child) => (
              <FeatureRow
                key={child.id}
                def={child}
                featureMap={featureMap}
                onFeatureBulkChange={onFeatureBulkChange}
                editable={editable}
                depth={1}
              />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  )
}

/** Feature rows with expandable parent-child hierarchy and Allowed/Restricted toggles. */
export default function PermissionGroup({
  definitions,
  featureMap,
  onFeatureBulkChange,
  onReplaceFeatures,
  searchQuery = '',
  editable = true,
  showColumnHeader = true,
}) {
  const handleGroupBulkChange = (children, enabled) => {
    if (!onReplaceFeatures || !featureMap) return
    const next = { ...featureMap }
    const permSet = enabled ? fullPermissionSet() : emptyPermissionSet()
    for (const child of children) {
      next[child.id] = { ...permSet }
    }
    onReplaceFeatures(next)
  }

  const handleSingleChange = (featureId, permissionSet) => {
    if (!featureMap) return
    onFeatureBulkChange?.(featureId, permissionSet)
  }

  const items = (Array.isArray(definitions) ? definitions : []).filter((d) =>
    matchesSearch(d, searchQuery),
  )

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
        No features match your search.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {showColumnHeader ? <PermissionColumnHeader /> : null}
      {items.map((def) => (
        <FeatureGroup
          key={def.id}
          def={def}
          featureMap={featureMap}
          onFeatureBulkChange={handleSingleChange}
          onGroupBulkChange={handleGroupBulkChange}
          editable={editable}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  )
}
