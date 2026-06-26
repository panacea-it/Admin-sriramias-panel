import { useSearchParams } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import RolePermissionMatrixView from '../../components/role-access/RolePermissionMatrixView'
import { useApiRolesCatalogSync } from '../../hooks/useApiRolesCatalogSync'

const BREADCRUMB = [
  { label: 'Admin Management' },
  { label: 'Role Access' },
  { label: 'Permission Matrix' },
]

export default function RoleAccessMatrixPage() {
  useApiRolesCatalogSync()

  const [searchParams] = useSearchParams()
  const focusRoleId = searchParams.get('focus') || ''

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <CategoryBreadcrumb items={BREADCRUMB} />

        <PageBanner
          icon={LayoutGrid}
          iconClassName="text-[#246392]"
          title="Role Permission Matrix"
          className="from-[#55ace7] via-[#8b98bb] to-[#df8284]"
        />

        <RolePermissionMatrixView focusRoleId={focusRoleId} />
      </section>
    </div>
  )
}
