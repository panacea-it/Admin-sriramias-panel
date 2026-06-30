import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Link2 } from 'lucide-react'
import PageBanner from '../figma/PageBanner'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import FreeLearningResourceRowActions from './FreeLearningResourceRowActions'
import {
  getSidebarSectionLabel,
  quickLinksEditPath,
  quickLinksViewPath,
  SIDEBAR_SECTION_DESCRIPTIONS,
} from '../../constants/quickLinksConstants'
import { fetchHomepageSidebarSections } from '../../api/homepageSidebarSectionsAPI'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { getApiErrorMessage } from '../../utils/apiError'
import { StatusBadge } from '../academics/AcademicsUi'
import { toast } from '@/utils/toast'

export default function QuickLinksTab() {
  const navigate = useNavigate()
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  const loadSections = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await fetchHomepageSidebarSections()
      setSections(rows)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load quick links sections'))
      setSections([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSections()
  }, [loadSections])

  const columns = useMemo(
    () => [
      {
        key: 'sectionName',
        label: 'Section',
        headerClassName: 'min-w-[180px]',
        render: (row) => (
          <div>
            <span className="font-semibold text-[#14213D]">
              {getSidebarSectionLabel(row.sectionKey)}
            </span>
            <p className="mt-1 text-xs text-[#667085]">
              {SIDEBAR_SECTION_DESCRIPTIONS[row.sectionKey] || '—'}
            </p>
          </div>
        ),
      },
      {
        key: 'heading',
        label: 'Heading',
        headerClassName: 'min-w-[140px]',
        render: (row) => <span className="text-sm text-[#111]">{row.heading || '—'}</span>,
      },
      {
        key: 'items',
        label: 'Items',
        headerClassName: 'min-w-[80px]',
        render: (row) => (
          <span className="text-sm text-[#667085]">
            {row.sectionKey === 'DAILY_QUIZ'
              ? `${row.quizOptions?.length || 0} options`
              : `${row.items?.length || 0} items`}
          </span>
        ),
      },
      {
        key: 'isActive',
        label: 'Status',
        headerClassName: 'min-w-[100px]',
        render: (row) => (
          <StatusBadge status={row.isActive !== false ? 'Active' : 'Deactivated'} />
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
            onView={() => navigate(quickLinksViewPath(row.sectionKey))}
            onEdit={() => navigate(quickLinksEditPath(row.sectionKey))}
          />
        ),
      },
    ],
    [navigate],
  )

  return (
    <div className="space-y-6">
      <PageBanner
        icon={Link2}
        iconClassName="text-[#246392]"
        title="Quick Links"
        subtitle="Manage student panel sidebar widgets: Our Books, Quick Links, Daily Learning, Daily Quiz, Courses, and Trending Videos."
        className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
      />

      <div className="rounded-2xl border border-[#E7ECF5] bg-white p-5 shadow-[0_8px_24px_rgba(7,19,63,0.05)] sm:p-6">
        <PaginatedFigmaTable
          columns={columns}
          data={sections}
          loading={loading}
          emptyMessage="No quick link sections found."
          itemLabel="sections"
          initialPageSize={10}
        />
      </div>
    </div>
  )
}
