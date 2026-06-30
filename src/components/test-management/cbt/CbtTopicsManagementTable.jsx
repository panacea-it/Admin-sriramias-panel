import { useMemo } from 'react'
import { CbtAdminTable } from './ui'
import { createActionsColumn } from '../../../utils/tableColumnHelpers'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'

function formatLastUpdated(iso) {
  if (!iso) return '—'
  return formatCategoryDateTime(iso)
}

export default function CbtTopicsManagementTable({
  topics,
  loading,
  resetDeps = [],
  emptyMessage,
  emptyState,
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Topic',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'min-w-[200px] align-middle',
        render: (row) => (
          <div className="min-w-0">
            <span
              className="block truncate font-semibold text-slate-900"
              title={row.title || ''}
            >
              {row.title || '—'}
            </span>
          </div>
        ),
      },
      {
        key: 'testCount',
        label: 'Test Series',
        align: 'center',
        headerClassName: 'min-w-[120px] whitespace-nowrap text-center',
        cellClassName: 'min-w-[120px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">{row.testCount ?? 0}</span>
        ),
      },
      {
        key: 'updatedAt',
        label: 'Last Updated',
        headerClassName: 'min-w-[150px] whitespace-nowrap',
        cellClassName: 'min-w-[150px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">{formatLastUpdated(row.updatedAt)}</span>
        ),
      },
      createActionsColumn({
        buttonCount: 1,
        align: 'center',
        render: (row) => renderActions(row),
      }),
    ],
    [renderActions],
  )

  return (
    <CbtAdminTable
      columns={columns}
      data={topics}
      emptyMessage={emptyMessage}
      emptyState={emptyState}
      itemLabel="topics"
      loading={loading}
      skeletonRowCount={8}
      initialPageSize={10}
      resetDeps={resetDeps}
      fullWidth
    />
  )
}
