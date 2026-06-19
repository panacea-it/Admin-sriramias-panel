import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import PageBanner from '../figma/PageBanner'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import FreeLearningResourceRowActions from './FreeLearningResourceRowActions'
import {
  freeLearningResourceEditPath,
  freeLearningResourceViewPath,
  getFreeLearningResourceLabel,
} from '../../constants/freeLearningResourceConstants'
import { fetchFreeLearningResources } from '../../api/freeLearningResourcesAPI'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { toast } from '@/utils/toast'

export default function FreeLearningResourcesTab() {
  const navigate = useNavigate()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  const loadResources = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchFreeLearningResources()
      setResources(rows)
    } catch (error) {
      toast.error(error?.message || 'Failed to load free learning resources')
      setResources([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadResources()
  }, [loadResources])

  const columns = useMemo(
    () => [
      {
        key: 'resourceName',
        label: 'Resource Name',
        headerClassName: 'min-w-[200px]',
        render: (row) => (
          <span className="font-semibold text-[#14213D]">
            {getFreeLearningResourceLabel(row.resourceType)}
          </span>
        ),
      },
      {
        key: 'updatedAt',
        label: 'Last Updated',
        headerClassName: 'min-w-[180px]',
        render: (row) => (
          <span className="text-sm text-[#667085]">
            {row.updatedAt ? formatCategoryDateTime(row.updatedAt) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[140px] text-right',
        cellClassName: 'text-right',
        render: (row) => (
          <FreeLearningResourceRowActions
            onView={() => navigate(freeLearningResourceViewPath(row.resourceType))}
            onEdit={() => navigate(freeLearningResourceEditPath(row.resourceType))}
          />
        ),
      },
    ],
    [navigate],
  )

  return (
    <div className="space-y-6">
      <PageBanner
        icon={BookOpen}
        iconClassName="text-[#246392]"
        title="Free Learning Resources"
        subtitle="Manage the four fixed home page learning resource cards."
        className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
      />

      <div className="rounded-2xl border border-[#E7ECF5] bg-white p-5 shadow-[0_8px_24px_rgba(7,19,63,0.05)] sm:p-6">
        <PaginatedFigmaTable
          columns={columns}
          data={resources}
          loading={loading}
          emptyMessage="No free learning resources found."
          itemLabel="resources"
          initialPageSize={10}
        />
      </div>
    </div>
  )
}
