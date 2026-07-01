import { useMemo } from 'react'
import { CbtAdminTable } from './ui'
import {
  CBT_TABLE_CELL_CENTER,
  CBT_TABLE_CELL_LEFT,
  CBT_TABLE_HEADER,
} from './ui/cbtTableStyles'
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
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[200px] pl-5 text-left`,
        cellClassName: `${CBT_TABLE_CELL_LEFT} min-w-[200px] pl-5 font-semibold text-slate-900`,
        render: (row) => (
          <span className="block truncate" title={row.title || ''}>
            {row.title || '—'}
          </span>
        ),
      },
      {
        key: 'testCount',
        label: 'Test Series',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[130px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[130px] font-medium tabular-nums text-[#111]`,
        render: (row) => row.testCount ?? 0,
      },
      {
        key: 'updatedAt',
        label: 'Last Updated',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[170px] text-left`,
        cellClassName: `${CBT_TABLE_CELL_LEFT} min-w-[170px] font-medium text-[#686868]`,
        render: (row) => formatLastUpdated(row.updatedAt),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[148px] pr-5 text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[148px] pr-5`,
        render: (row) => renderActions(row),
      },
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
      tableMinWidth={720}
    />
  )
}
