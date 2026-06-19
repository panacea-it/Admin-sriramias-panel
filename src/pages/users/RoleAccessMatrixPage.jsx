import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from '@/utils/toast'
import { LayoutGrid } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import RoleAccessMatrix from '../../components/admin-management/RoleAccessMatrix'
import { useApiRolesCatalogSync } from '../../hooks/useApiRolesCatalogSync'
import { useAdminRolesSafe } from '../../contexts/AdminRolesContext'
import { getApiErrorMessage } from '../../utils/apiError'
import { syncPermissionMatrixBulk } from '../../services/permissionService'
import { nestedRbacToBulkUpdates } from '../../utils/permissionMatrixSync'

const BREADCRUMB = [
  { label: 'Admin Management' },
  { label: 'Admin Access' },
]

export default function RoleAccessMatrixPage() {
  useApiRolesCatalogSync()
  const adminRoles = useAdminRolesSafe()

  const [searchParams] = useSearchParams()
  const focusRoleId = searchParams.get('focus') || ''

  const handleSavePermissions = useCallback(async (detail) => {
    if (!detail?.rbacPayload || !detail?.nestedState || !Array.isArray(detail.rbacPayload.roles)) {
      toast.error('Unable to save permissions. Please refresh and try again.')
      return
    }

    if (!detail.fullExport?.roleDefinitions) {
      toast.error('Unable to save permissions. Please refresh and try again.')
      return
    }

    const updates = nestedRbacToBulkUpdates(
      detail.nestedState,
      detail.matrixIndex,
      adminRoles.roles,
    )

    if (!updates.length) {
      toast.error('No backend permission modules available to sync.')
      return
    }

    try {
      const response = await syncPermissionMatrixBulk(updates)
      if (response?.success === false) {
        throw new Error(response?.message || 'Some permission updates failed')
      }

      toast.success('Permissions saved', {
        description: 'Role permissions have been applied across the admin panel.',
      })
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save permissions to server'))
    }
  }, [adminRoles.roles])

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <CategoryBreadcrumb items={BREADCRUMB} />

        <PageBanner
          icon={LayoutGrid}
          iconClassName="text-[#246392]"
          title="Admin Access"
          className="from-[#55ace7] via-[#8b98bb] to-[#df8284]"
        />

        <RoleAccessMatrix onSave={handleSavePermissions} focusRoleId={focusRoleId} />
      </section>
    </div>
  )
}
