import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from '@/utils/toast'
import ErrorState from '../feedback/ErrorState'
import { cn } from '../../utils/cn'
import { getApiErrorMessage } from '../../utils/apiError'
import { handleApiError } from '../../utils/errorHandler'
import { useRoleAccessList } from '../../hooks/roleAccess/useRoleAccessList'
import {
  useModulePermissionAction,
  usePermissionMatrixByRole,
  useUpdateFeaturePermission,
} from '../../hooks/roleAccess/usePermissionMatrix'

function FeatureToggle({ feature, matrixId, roleId, disabled, togglingKey, onToggle }) {
  const key = `${matrixId}:${feature.featureKey}`
  const isToggling = togglingKey === key

  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200/80 bg-white px-3 py-2.5 transition hover:border-violet-200 hover:bg-violet-50/30',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500/30"
        checked={Boolean(feature.allowed)}
        disabled={disabled || isToggling}
        onChange={(e) => onToggle(matrixId, feature.featureKey, e.target.checked)}
      />
      <span className="flex-1 text-sm font-medium text-slate-800">{feature.featureTitle}</span>
      {isToggling ? <Loader2 className="h-4 w-4 animate-spin text-violet-500" /> : null}
    </label>
  )
}

function ModulePanel({ module, roleId, disabled, togglingKey, onModuleAction, onFeatureToggle }) {
  const [open, setOpen] = useState(true)
  const matrixId = module._id || module.matrixId

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {open ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-slate-500" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{module.moduleTitle}</p>
            <p className="text-[11px] text-slate-500">
              {module.allowedCount ?? 0} allowed · {module.restrictedCount ?? 0} restricted ·{' '}
              {module.totalFeatures ?? module.permissions?.length ?? 0} total
            </p>
          </div>
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onModuleAction(matrixId, 'enable_all')}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            Enable all
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onModuleAction(matrixId, 'restrict_all')}
            className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
          >
            Restrict all
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onModuleAction(matrixId, 'reset')}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </div>
      {open ? (
        <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {(module.permissions || module.features || []).map((feature) => (
            <FeatureToggle
              key={feature.featureKey}
              feature={feature}
              matrixId={matrixId}
              roleId={roleId}
              disabled={disabled}
              togglingKey={togglingKey}
              onToggle={onFeatureToggle}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default function RolePermissionMatrixView({ focusRoleId = '' }) {
  const { data: rolesListData, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } =
    useRoleAccessList({ status: 'ALL', limit: 100, page: 1, sortBy: 'roleTitle', sortOrder: 'asc' })

  const roles = rolesListData?.items ?? []
  const [selectedRoleId, setSelectedRoleId] = useState('')

  useEffect(() => {
    if (focusRoleId && roles.some((r) => r.id === focusRoleId)) {
      setSelectedRoleId(focusRoleId)
      return
    }
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id)
    }
  }, [focusRoleId, roles, selectedRoleId])

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  )

  const {
    data: matrixData,
    isLoading: matrixLoading,
    isFetching: matrixFetching,
    error: matrixError,
    refetch: refetchMatrix,
  } = usePermissionMatrixByRole(selectedRoleId)

  const featureMutation = useUpdateFeaturePermission(selectedRoleId)
  const moduleMutation = useModulePermissionAction(selectedRoleId)
  const [togglingKey, setTogglingKey] = useState(null)
  const [moduleActionId, setModuleActionId] = useState(null)

  const handleFeatureToggle = useCallback(
    async (permissionId, featureKey, allowed) => {
      const key = `${permissionId}:${featureKey}`
      setTogglingKey(key)
      try {
        await featureMutation.mutateAsync({ permissionId, featureKey, allowed })
      } catch (error) {
        handleApiError(error, { fallback: 'Failed to update permission' })
      } finally {
        setTogglingKey(null)
      }
    },
    [featureMutation],
  )

  const handleModuleAction = useCallback(
    async (permissionId, action) => {
      setModuleActionId(permissionId)
      try {
        await moduleMutation.mutateAsync({ permissionId, action })
        toast.success('Module permissions updated')
        await refetchMatrix()
      } catch (error) {
        handleApiError(error, { fallback: 'Failed to update module permissions' })
      } finally {
        setModuleActionId(null)
      }
    },
    [moduleMutation, refetchMatrix],
  )

  const modules = matrixData?.modules ?? []
  const summary = matrixData?.role
    ? {
        allowedCount: matrixData.allowedCount ?? 0,
        restrictedCount: matrixData.restrictedCount ?? 0,
        totalFeatures: matrixData.totalFeatures ?? 0,
      }
    : null

  if (rolesLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-16 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin text-[#246392]" />
        Loading roles…
      </div>
    )
  }

  if (rolesError) {
    return (
      <ErrorState
        title="Unable to load roles"
        message={getApiErrorMessage(rolesError, 'Failed to load roles')}
        onRetry={refetchRoles}
      />
    )
  }

  if (!roles.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm font-semibold text-slate-600">No roles available.</p>
        <p className="mt-1 text-xs text-slate-500">Create a role under Role Access first.</p>
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_40px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Permission matrix</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Feature permissions are loaded from the server. Each toggle saves immediately.
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <label htmlFor="role-matrix-select" className="mb-1 block text-[12px] font-semibold text-slate-600">
              Role
            </label>
            <select
              id="role-matrix-select"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.label} ({role.roleCode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedRole ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/50 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{selectedRole.label}</p>
              <p className="font-mono text-[11px] text-slate-500">{selectedRole.roleCode}</p>
            </div>
            {summary ? (
              <p className="ml-auto text-xs text-slate-600">
                <span className="font-semibold text-emerald-700">{summary.allowedCount}</span> allowed ·{' '}
                <span className="font-semibold text-slate-700">{summary.restrictedCount}</span> restricted ·{' '}
                <span className="font-semibold">{summary.totalFeatures}</span> features
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="space-y-4 px-4 py-5 sm:px-6">
        {matrixLoading || matrixFetching ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            Loading permission matrix…
          </div>
        ) : matrixError ? (
          <ErrorState
            title="Unable to load permissions"
            message={getApiErrorMessage(matrixError, 'Failed to load permission matrix')}
            onRetry={refetchMatrix}
          />
        ) : modules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
            No permission modules found for this role.
          </div>
        ) : (
          modules.map((mod) => (
            <ModulePanel
              key={mod._id || mod.moduleKey}
              module={mod}
              roleId={selectedRoleId}
              disabled={Boolean(moduleActionId) || featureMutation.isPending}
              togglingKey={togglingKey}
              onModuleAction={handleModuleAction}
              onFeatureToggle={handleFeatureToggle}
            />
          ))
        )}
      </div>
    </section>
  )
}
