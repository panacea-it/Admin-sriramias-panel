import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Search, Shield, Pencil, Save } from 'lucide-react'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'
import { useAdminRoles } from '../../contexts/AdminRolesContext'
import { PERMISSION_MODULES } from '../../data/adminManagementConfig'
import AccessStatusChip from './AccessStatusChip'
import MatrixModuleTooltip from './MatrixModuleTooltip'
import PermissionDrawer from './PermissionDrawer'
import {
  cloneNestedRbac,
  deriveModuleAccessStatus,
  getDefaultNestedRbacForRoles,
  rbacStateToFullExport,
  rbacStateToRolesPayload,
} from '../../utils/rbacHelpers'
import {
  clearStoredRbac,
  getDefaultModuleFeatures,
  getInitialRbacState,
  NESTED_RBAC_CHANGED_EVENT,
  persistRbacState,
  readMergedRbac,
  syncNestedKeysForRoles,
} from '../../utils/rbacStorage'
import { getStoredRolesOrSeed } from '../../utils/adminRolesStorage'
import { getModuleFeatureCount, getModuleFeatureLabels } from '../../utils/matrixModuleMeta'

const MODULE_COL_WIDTH = 100
const ROLE_COL_WIDTH = 236

const RoleAccessMatrix = forwardRef(function RoleAccessMatrix({ onSave, focusRoleId }, ref) {
  const { roles, matrixRoles } = useAdminRoles()

  const roleIdsKey = useMemo(
    () =>
      matrixRoles
        .map((r) => r.id)
        .sort()
        .join('|'),
    [matrixRoles],
  )

  const [nestedRbac, setNestedRbac] = useState(() => getInitialRbacState(getStoredRolesOrSeed()))
  const [editable, setEditable] = useState(false)
  const [roleFilter, setRoleFilter] = useState('')
  const [hoveredModule, setHoveredModule] = useState(null)
  const [activeRole, setActiveRole] = useState(null)
  const [drawer, setDrawer] = useState(null)
  const [hasUnsavedApiDraft, setHasUnsavedApiDraft] = useState(false)

  useEffect(() => {
    setNestedRbac((prev) => syncNestedKeysForRoles(prev, roles))
  }, [roleIdsKey, roles])

  useEffect(() => {
    const onExternal = () => {
      setNestedRbac(readMergedRbac(roles))
    }
    window.addEventListener(NESTED_RBAC_CHANGED_EVENT, onExternal)
    return () => window.removeEventListener(NESTED_RBAC_CHANGED_EVENT, onExternal)
  }, [roleIdsKey, roles])

  useEffect(() => {
    const id = String(focusRoleId || '').trim()
    if (!id) return
    const meta = matrixRoles.find((r) => r.id === id)
    if (meta?.label) setRoleFilter(meta.label)
  }, [focusRoleId, matrixRoles])

  const matrixMinWidth = useMemo(
    () => ROLE_COL_WIDTH + PERMISSION_MODULES.length * MODULE_COL_WIDTH,
    [],
  )

  const matrixGridStyle = useMemo(
    () => ({
      gridTemplateColumns: `minmax(${ROLE_COL_WIDTH}px, ${ROLE_COL_WIDTH}px) repeat(${PERMISSION_MODULES.length}, minmax(${MODULE_COL_WIDTH - 4}px, ${MODULE_COL_WIDTH}px))`,
    }),
    [],
  )

  const resetMatrix = useCallback(() => {
    clearStoredRbac()
    setNestedRbac(cloneNestedRbac(getDefaultNestedRbacForRoles(roles)))
    setDrawer(null)
    setHasUnsavedApiDraft(false)
  }, [roles])

  useImperativeHandle(ref, () => resetMatrix)

  const replaceModuleFeatures = useCallback((roleId, moduleId, nextMap) => {
    setNestedRbac((prev) => {
      const next = {
        ...prev,
        [roleId]: {
          ...(prev[roleId] || {}),
          [moduleId]: typeof nextMap === 'object' && nextMap ? { ...nextMap } : {},
        },
      }
      try {
        persistRbacState(next)
      } catch {
        toast.error('Failed to save permissions', {
          description: 'Could not persist changes locally. Check storage access.',
        })
      }
      setHasUnsavedApiDraft(true)
      return next
    })
  }, [])

  const openDrawer = useCallback((roleId, moduleId, roleFullAccess, roleEnabled) => {
    if (roleFullAccess) return
    if (!roleEnabled) {
      toast.warning('Access type is disabled', {
        description: 'Enable the role under Admin Access before editing permissions.',
      })
      return
    }
    const src = nestedRbac[roleId]?.[moduleId]
    if (!src) return
    setEditable(true)
    setDrawer({ roleId, moduleId })
  }, [nestedRbac])

  const handleDrawerSave = useCallback(() => {
    toast.success('Permissions updated successfully', {
      description: 'Changes are stored locally and reflected in the matrix.',
    })
  }, [])

  const closeDrawer = useCallback(() => setDrawer(null), [])

  const drawerRole = useMemo(
    () => (drawer ? matrixRoles.find((r) => r.id === drawer.roleId) : null),
    [drawer, matrixRoles],
  )

  const drawerModuleMeta = useMemo(
    () => (drawer ? PERMISSION_MODULES.find((m) => m.id === drawer.moduleId) : null),
    [drawer],
  )

  const drawerFeatures = drawer && drawerRole && !drawerRole.fullAccess
    ? nestedRbac[drawer.roleId]?.[drawer.moduleId]
    : null

  const filteredRoles = useMemo(() => {
    const q = roleFilter.trim().toLowerCase()
    if (!q) return matrixRoles
    return matrixRoles.filter((r) => r.label.toLowerCase().includes(q))
  }, [matrixRoles, roleFilter])

  const moduleGrantCount = (roleId, fullAccess) => {
    if (fullAccess) return PERMISSION_MODULES.length
    return PERMISSION_MODULES.filter(
      (m) => deriveModuleAccessStatus(nestedRbac[roleId]?.[m.id], m.id) !== 'restricted',
    ).length
  }

  const submitMatrixSave = () => {
    try {
      persistRbacState(nestedRbac)
    } catch {
      toast.error('Failed to save permissions', {
        description: 'Local persistence failed. Please try again.',
      })
      return
    }

    const payload = rbacStateToRolesPayload(nestedRbac)
    const nestedState = cloneNestedRbac(nestedRbac)
    const fullExport = rbacStateToFullExport(nestedRbac, roles)

    if (!payload?.roles?.length) {
      toast.error('Invalid permission state')
      return
    }

    onSave?.({ rbacPayload: payload, nestedState, fullExport })
    setHasUnsavedApiDraft(false)
    setEditable(false)
  }

  const drawerDefaultTemplate = useMemo(() => {
    if (!drawer) return null
    return getDefaultModuleFeatures(drawer.roleId, drawer.moduleId, roles)
  }, [drawer, roles])

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.06)]"
    >
      {/* Action toolbar */}
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Permission matrix</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Click a status pill to configure features. Hover a module for its feature list.
            </p>
          </div>
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
            <label className="relative block min-w-0 flex-1 sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                placeholder="Search roles…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/12"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                if (editable && hasUnsavedApiDraft) {
                  toast.warning('Unsaved API draft', {
                    description:
                      'Local permissions are saved. Use Save permissions when you are ready to sync the API payload.',
                  })
                }
                if (!editable) {
                  setEditable(true)
                  return
                }
                setEditable(false)
              }}
              className={cn(
                'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition',
                editable
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm shadow-violet-500/20'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              <Pencil className="h-3.5 w-3.5" />
              {editable ? 'Editing' : 'Edit'}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop matrix */}
      <div className="custom-scrollbar hidden max-h-[min(80vh,880px)] overflow-auto md:block">
        <div className="min-w-full" style={{ minWidth: `${matrixMinWidth}px` }}>
          {/* Sticky header */}
          <div
            className="sticky top-0 z-30 grid border-b border-slate-200 bg-slate-50/98 shadow-[0_4px_14px_rgba(15,23,42,0.06)] backdrop-blur-md"
            style={matrixGridStyle}
          >
            <div className="sticky left-0 z-40 flex h-12 items-center border-r border-slate-200/80 bg-slate-50 px-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Role</span>
            </div>
            {PERMISSION_MODULES.map((mod) => {
              const featureCount = getModuleFeatureCount(mod.id)
              const featureLabels = getModuleFeatureLabels(mod.id)

              return (
                <div
                  key={mod.id}
                  className={cn(
                    'flex h-12 items-center justify-center border-r border-slate-100/80 px-1 transition-colors last:border-r-0',
                    hoveredModule === mod.id && 'bg-violet-100/50',
                  )}
                  onMouseEnter={() => setHoveredModule(mod.id)}
                  onMouseLeave={() => setHoveredModule(null)}
                >
                  <MatrixModuleTooltip
                    title={mod.label}
                    description={mod.description}
                    features={featureLabels}
                  >
                    <div className="flex max-w-[92px] flex-col items-center gap-0.5 px-1 py-1 text-center">
                      <mod.icon className="h-4 w-4 text-violet-600" strokeWidth={2} />
                      <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-slate-800">
                        {mod.label}
                      </span>
                      <span className="text-[9px] font-medium text-slate-400">{featureCount} features</span>
                    </div>
                  </MatrixModuleTooltip>
                </div>
              )
            })}
          </div>

          {filteredRoles.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm font-semibold text-slate-600">
                {roleFilter.trim() ? 'No roles match your search.' : 'No roles configured yet.'}
              </p>
              {roleFilter.trim() ? (
                <button
                  type="button"
                  onClick={() => setRoleFilter('')}
                  className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef2fc]"
                >
                  Clear search
                </button>
              ) : null}
            </div>
          ) : null}

          {filteredRoles.map((role, rowIdx) => {
            const isActive = activeRole === role.id
            const count = moduleGrantCount(role.id, role.fullAccess)
            const isZebra = rowIdx % 2 === 1
            const rowSurface = cn(
              isZebra ? 'bg-slate-50/60' : 'bg-white',
              'group-hover/matrix:bg-violet-50/50',
              isActive && '!bg-violet-50/55',
            )

            return (
              <div
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={cn(
                  'group/matrix grid min-h-[76px] border-b border-slate-100/90 transition-colors duration-150 last:border-0',
                  !role.enabled && 'opacity-[0.86]',
                  isActive && 'ring-1 ring-inset ring-violet-200/60',
                )}
                style={matrixGridStyle}
              >
                {/* Sticky role card */}
                <div
                  className={cn(
                    'sticky left-0 z-20 flex items-center gap-3 border-r border-slate-100/90 px-4 py-4 backdrop-blur-sm transition-colors duration-150',
                    rowSurface,
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-violet-100/80 text-violet-600 ring-1 ring-violet-100">
                    <role.icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-slate-900">{role.label}</p>
                      {!role.fullAccess && !role.enabled ? (
                        <span className="shrink-0 rounded bg-slate-200/90 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-600">
                          Off
                        </span>
                      ) : null}
                    </div>
                    {role.fullAccess ? (
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <Shield className="h-3 w-3" />
                        Full platform access
                      </p>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{count}</span> modules enabled
                      </p>
                    )}
                  </div>
                </div>

                {PERMISSION_MODULES.map((mod) => {
                  const highlightCol = hoveredModule === mod.id
                  const featureMap = role.fullAccess ? null : nestedRbac[role.id]?.[mod.id]
                  const status = role.fullAccess
                    ? 'full'
                    : deriveModuleAccessStatus(featureMap, mod.id)

                  return (
                    <div
                      key={mod.id}
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        openDrawer(role.id, mod.id, role.fullAccess, role.enabled)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          e.stopPropagation()
                          openDrawer(role.id, mod.id, role.fullAccess, role.enabled)
                        }
                      }}
                      className={cn(
                        'flex min-h-[76px] cursor-pointer items-center justify-center border-r border-slate-100/60 px-2 py-4 transition-colors duration-150 last:border-r-0',
                        rowSurface,
                        highlightCol && '!bg-violet-100/45',
                      )}
                    >
                      <AccessStatusChip
                        status={status}
                        disabled={!role.enabled && !role.fullAccess}
                        interactive={!role.fullAccess}
                        compact
                        onPress={() => openDrawer(role.id, mod.id, role.fullAccess, role.enabled)}
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile */}
      <div className="space-y-3 px-4 py-4 md:hidden">
        {filteredRoles.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-600">
              {roleFilter.trim() ? 'No roles match your search.' : 'No roles configured yet.'}
            </p>
            {roleFilter.trim() ? (
              <button
                type="button"
                onClick={() => setRoleFilter('')}
                className="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#246392]"
              >
                Clear search
              </button>
            ) : null}
          </div>
        ) : null}

        {filteredRoles.map((role) => (
          <div
            key={role.id}
            className={cn(
              'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm',
              !role.enabled && 'opacity-[0.9]',
            )}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <role.icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{role.label}</p>
                {role.fullAccess ? (
                  <p className="mt-0.5 text-[11px] font-medium text-emerald-700">Full platform access</p>
                ) : (
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {moduleGrantCount(role.id, false)} modules enabled
                  </p>
                )}
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {PERMISSION_MODULES.map((mod) => {
                const featureMap = role.fullAccess ? null : nestedRbac[role.id]?.[mod.id]
                const status = role.fullAccess
                  ? 'full'
                  : deriveModuleAccessStatus(featureMap, mod.id)

                return (
                  <button
                    key={mod.id}
                    type="button"
                    disabled={role.fullAccess}
                    onClick={() => openDrawer(role.id, mod.id, role.fullAccess, role.enabled)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <mod.icon className="h-4 w-4 shrink-0 text-violet-500" />
                      <span className="truncate text-sm font-medium text-slate-800">{mod.label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <AccessStatusChip status={status} compact interactive={false} />
                      {!role.fullAccess && role.enabled ? (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      ) : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {editable && (
        <div className="flex flex-col items-end gap-1.5 border-t border-slate-100 px-4 py-3.5 sm:px-6">
          <p className="w-full text-right text-[11px] text-slate-400 sm:w-auto">
            Saves to this browser until server sync is available.
          </p>
          <button
            type="button"
            onClick={submitMatrixSave}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            <Save className="h-4 w-4" />
            Save permissions
          </button>
        </div>
      )}

      <PermissionDrawer
        open={!!drawer && !!drawerRole && !!drawerModuleMeta}
        onClose={closeDrawer}
        role={drawerRole}
        module={drawerModuleMeta}
        featureMap={drawerFeatures || {}}
        defaultTemplateFeatures={drawerDefaultTemplate || undefined}
        onReplaceFeatures={replaceModuleFeatures}
        onSave={handleDrawerSave}
      />
    </motion.section>
  )
})

export default RoleAccessMatrix
