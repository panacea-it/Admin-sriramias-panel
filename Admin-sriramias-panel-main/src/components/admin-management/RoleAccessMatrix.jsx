import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Search, Shield, Pencil, Save } from 'lucide-react'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'
import { useAdminRoles } from '../../contexts/AdminRolesContext'
import { PERMISSION_MODULES } from '../../data/adminManagementConfig'
import AccessStatusChip from './AccessStatusChip'
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

  const matrixGridStyle = useMemo(
    () => ({
      gridTemplateColumns: `minmax(236px, 280px) repeat(${PERMISSION_MODULES.length}, minmax(116px, 1fr))`,
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
    return PERMISSION_MODULES.filter((m) => deriveModuleAccessStatus(nestedRbac[roleId]?.[m.id]) !== 'restricted')
      .length
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
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-[0_8px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl"
    >
      <div className="border-b border-slate-100/90 px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Permission matrix
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-500">
              Module-level access with granular feature RBAC. Click any status chip to open the permission
              drawer. Status reflects feature coverage: Full Access, Custom, or Restricted.
            </p>
            <p className="text-xs font-medium text-slate-400">
              Permissions are stored locally until the server sync is available.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:w-auto md:min-w-[320px]">
            <label className="relative block flex-1 md:min-w-[220px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                placeholder="Search roles…"
                className="w-full rounded-xl border border-slate-200/80 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15"
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
                'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                editable
                  ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25'
                  : 'border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              <Pencil className="h-4 w-4" />
              {editable ? 'Editing' : 'Edit mode'}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden max-h-[min(74vh,800px)] overflow-auto md:block">
        <div
          className="min-w-[min(100%,1100px)]"
          style={{ minWidth: `min(100%, ${280 + PERMISSION_MODULES.length * 124}px)` }}
        >
          <div
            className="sticky top-0 z-30 grid border-b border-slate-200/90 bg-slate-50/95 shadow-[0_4px_12px_rgba(15,23,42,0.06)] backdrop-blur-md"
            style={matrixGridStyle}
          >
            <div className="sticky left-0 z-40 flex min-h-[56px] items-center justify-center border-r border-slate-200/80 bg-slate-50/98 px-5 py-4 text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                Role
              </span>
            </div>
            {PERMISSION_MODULES.map((mod) => (
              <div
                key={mod.id}
                className={cn(
                  'px-3 py-4 text-center transition-colors duration-200',
                  hoveredModule === mod.id && 'bg-violet-100/50',
                )}
                onMouseEnter={() => setHoveredModule(mod.id)}
                onMouseLeave={() => setHoveredModule(null)}
              >
                <mod.icon className="mx-auto h-[18px] w-[18px] text-violet-600" />
                <p className="mt-2 text-xs font-bold leading-tight text-slate-800">
                  {mod.label}
                </p>
                <p className="mt-1 hidden text-[10px] font-medium text-slate-400 xl:block">
                  {mod.description}
                </p>
              </div>
            ))}
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

          {filteredRoles.map((role) => {
            const isActive = activeRole === role.id
            const count = moduleGrantCount(role.id, role.fullAccess)

            return (
              <div
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={cn(
                  'grid border-b border-slate-100/90 transition-colors duration-200 last:border-0',
                  isActive && 'bg-violet-50/40 ring-1 ring-inset ring-violet-200/50',
                  !isActive && 'hover:bg-slate-50/70',
                  !role.enabled && 'opacity-[0.88]',
                )}
                style={matrixGridStyle}
              >
                <div className="sticky left-0 z-20 flex items-center justify-center gap-3 border-r border-slate-100/90 bg-white/98 px-5 py-4 text-center backdrop-blur-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <role.icon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900">{role.label}</p>
                      {!role.fullAccess && !role.enabled ? (
                        <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                          Disabled
                        </span>
                      ) : null}
                    </div>
                    {role.fullAccess ? (
                      <span className="mt-1 inline-flex items-center justify-center gap-0.5 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-500/20">
                        <Shield className="h-2.5 w-2.5" />
                        Full platform
                      </span>
                    ) : (
                      <span className="mt-1 block text-[11px] font-medium text-slate-500">
                        {count} of {PERMISSION_MODULES.length} modules active
                      </span>
                    )}
                  </div>
                </div>

                {PERMISSION_MODULES.map((mod) => {
                  const highlightCol = hoveredModule === mod.id
                  const featureMap = role.fullAccess ? null : nestedRbac[role.id]?.[mod.id]
                  const status = role.fullAccess ? 'full' : deriveModuleAccessStatus(featureMap)

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
                        'flex cursor-pointer items-center justify-center px-2 py-4 transition-colors duration-200',
                        highlightCol && 'bg-violet-50/50',
                      )}
                    >
                      {role.fullAccess ? (
                        <span className="rounded-full bg-emerald-500/12 px-3 py-1.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-500/25">
                          Full Access
                        </span>
                      ) : (
                        <AccessStatusChip
                          status={status}
                          disabled={!role.enabled}
                          interactive
                          onPress={() => openDrawer(role.id, mod.id, role.fullAccess, role.enabled)}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-3 px-4 py-5 md:hidden">
        {filteredRoles.length === 0 ? (
          <div className="rounded-2xl border border-slate-200/80 bg-white px-6 py-12 text-center">
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

        {filteredRoles.map((role) => (
          <div
            key={role.id}
            className={cn(
              'overflow-hidden rounded-2xl border border-slate-200/80 bg-white',
              !role.enabled && 'opacity-[0.9]',
            )}
          >
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <role.icon className="h-[18px] w-[18px]" />
              </div>
              <div className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="block truncate text-sm font-bold text-slate-900">{role.label}</span>
                  {!role.fullAccess && !role.enabled ? (
                    <span className="shrink-0 rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase">
                      Off
                    </span>
                  ) : null}
                </span>
                {role.fullAccess ? (
                  <span className="mt-0.5 inline-block text-[10px] font-bold uppercase text-emerald-600">Full platform</span>
                ) : (
                  <span className="text-xs text-slate-500">
                    {moduleGrantCount(role.id, false)} / {PERMISSION_MODULES.length} modules
                  </span>
                )}
              </div>
            </div>
            <div className="divide-y divide-slate-100">
              {PERMISSION_MODULES.map((mod) => {
                const featureMap = role.fullAccess ? null : nestedRbac[role.id]?.[mod.id]
                const status = role.fullAccess ? 'full' : deriveModuleAccessStatus(featureMap)

                return (
                  <button
                    key={mod.id}
                    type="button"
                    disabled={role.fullAccess}
                    onClick={() => openDrawer(role.id, mod.id, role.fullAccess, role.enabled)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50',
                      role.fullAccess && 'opacity-80',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <mod.icon className="h-4 w-4 shrink-0 text-slate-400" />
                      <span className="truncate text-sm font-semibold text-slate-800">{mod.label}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {role.fullAccess ? (
                        <span className="text-xs font-bold text-emerald-600">Full</span>
                      ) : (
                        <AccessStatusChip status={status} compact interactive={false} />
                      )}
                      {!role.fullAccess && role.enabled ? <ChevronRight className="h-4 w-4 text-slate-400" /> : null}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {editable && (
        <div className="flex flex-col items-end gap-2 border-t border-slate-100 px-5 py-4 sm:px-7">
          <p className="w-full text-right text-xs text-slate-400 sm:w-auto">
            Saves to this browser until server sync is available.
          </p>
          <button
            type="button"
            onClick={submitMatrixSave}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
          >
            <Save className="h-4 w-4" />
            Save permissions (local)
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
