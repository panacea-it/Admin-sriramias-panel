import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Shield, Save, Sparkles, Ban, RotateCcw } from 'lucide-react'
import { toast } from '@/utils/toast'
import { RBAC_MODULE_FEATURES } from '../../data/rbacConfig'
import {
  buildEmptyFeatureMap,
  buildFullFeatureMap,
  deriveModuleAccessStatus,
  featureSummary,
} from '../../utils/rbacHelpers'
import AccessStatusChip from './AccessStatusChip'
import PermissionGroup from './PermissionGroup'
import PermissionSearch from './PermissionSearch'
import PermissionSummary from './PermissionSummary'
import Modal from '../ui/Modal'

function displayRoleTitle(label) {
  return String(label || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

/** Centered permission dialog when a matrix cell is clicked (Admin Access page). */
export default function PermissionDrawer({
  open,
  onClose,
  role,
  module: mod,
  featureMap,
  defaultTemplateFeatures,
  onReplaceFeatures,
  onSave,
}) {
  const [search, setSearch] = useState('')
  const sessionBaselineRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setSearch('')
      sessionBaselineRef.current = null
      return
    }
    sessionBaselineRef.current = JSON.parse(JSON.stringify(featureMap || {}))
  }, [open, mod?.id, role?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const definitions = useMemo(() => (mod?.id ? RBAC_MODULE_FEATURES[mod.id] || [] : []), [mod])
  const status = useMemo(() => deriveModuleAccessStatus(featureMap), [featureMap])
  const summary = useMemo(() => featureSummary(featureMap), [featureMap])

  const handleRestrictAll = useCallback(() => {
    if (!mod || !role) return
    onReplaceFeatures(role.id, mod.id, buildEmptyFeatureMap(mod.id))
  }, [mod, role, onReplaceFeatures])

  const handleEnableAll = useCallback(() => {
    if (!mod || !role) return
    onReplaceFeatures(role.id, mod.id, buildFullFeatureMap(mod.id))
  }, [mod, role, onReplaceFeatures])

  const handleReset = useCallback(() => {
    if (!mod || !role) return
    const baseline = sessionBaselineRef.current
    if (baseline && typeof baseline === 'object') {
      onReplaceFeatures(role.id, mod.id, JSON.parse(JSON.stringify(baseline)))
      toast.success('Reset permissions', {
        description: 'Restored permissions from when you opened this dialog.',
      })
      return
    }
    if (!defaultTemplateFeatures || typeof defaultTemplateFeatures !== 'object') return
    onReplaceFeatures(role.id, mod.id, JSON.parse(JSON.stringify(defaultTemplateFeatures)))
    toast.success('Reset permissions', {
      description: `Restored default template for ${mod.label}.`,
    })
  }, [mod, role, defaultTemplateFeatures, onReplaceFeatures])

  const handleFeatureBulkChange = useCallback(
    (featureId, permissionSet) => {
      if (!mod || !role || !featureMap) return
      onReplaceFeatures(role.id, mod.id, { ...featureMap, [featureId]: { ...permissionSet } })
    },
    [mod, role, featureMap, onReplaceFeatures],
  )

  const persist = useCallback(() => {
    sessionBaselineRef.current = JSON.parse(JSON.stringify(featureMap || {}))
    onSave?.()
    onClose()
  }, [onSave, onClose, featureMap])

  if (!open || !mod || !role) return null

  const ModIcon = mod?.icon

  return (
    <Modal open={open} onClose={onClose} size="xl" title={`${mod.label}`}>
      <div className="relative flex max-h-[min(92vh,820px)] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
        <header className="shrink-0 border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-4 pr-14">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                {ModIcon && (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <ModIcon className="h-5 w-5" strokeWidth={2} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-600">
                    {displayRoleTitle(role.label)}
                  </p>
                  <h2 id="permission-dialog-title" className="mt-0.5 text-xl font-bold text-slate-900">
                    {mod.label}
                  </h2>
                </div>
              </div>
              {mod.description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {mod.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Module status</span>
                <AccessStatusChip status={status} disabled interactive={false} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleEnableAll}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 sm:flex-none"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Enable All
            </button>
            <button
              type="button"
              onClick={handleRestrictAll}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-rose-200/80 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 transition hover:bg-rose-100 sm:flex-none"
            >
              <Ban className="h-3.5 w-3.5" />
              Restrict All
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </header>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {status === 'restricted' && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-[13px] text-amber-900">
              <Shield className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Module is restricted. Use the switches below, <strong>Enable All</strong>, or{' '}
                <strong>Reset</strong>.
              </span>
            </div>
          )}

          <PermissionSummary allowed={summary.allowed} restricted={summary.restricted} total={summary.total} />

          <div className="my-5 h-px bg-slate-100" />

          <PermissionSearch
            id="perm-dialog-search"
            value={search}
            onChange={setSearch}
            placeholder="Filter features…"
          />

          <h3 className="mt-4 mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Feature-level access
          </h3>

          <PermissionGroup
            definitions={definitions}
            featureMap={featureMap}
            onFeatureBulkChange={handleFeatureBulkChange}
            searchQuery={search}
            editable
          />
        </div>

        <footer className="flex shrink-0 justify-end gap-3 border-t border-slate-200/80 bg-white/98 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={persist}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </footer>
      </div>
    </Modal>
  )
}
