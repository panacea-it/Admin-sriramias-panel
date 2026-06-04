import { useSearchParams } from 'react-router-dom'
import { toast } from '@/utils/toast'
import { LayoutGrid } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import RoleAccessMatrix from '../../components/admin-management/RoleAccessMatrix'

const BREADCRUMB = [
  { label: 'Admin Management' },
  { label: 'Admin Access' },
]

export default function RoleAccessMatrixPage() {
  const [searchParams] = useSearchParams()
  const focusRoleId = searchParams.get('focus') || ''

  const handleSavePermissions = (detail) => {
    if (!detail?.rbacPayload || !detail?.nestedState || !Array.isArray(detail.rbacPayload.roles)) {
      toast.error('Invalid permission state')
      return
    }

    if (!detail.fullExport?.roleDefinitions) {
      toast.error('Invalid export payload — role catalog missing')
      return
    }

    toast.success('Permissions saved', {
      description: 'Access control updated successfully across roles and modules.',
    })
  }

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

