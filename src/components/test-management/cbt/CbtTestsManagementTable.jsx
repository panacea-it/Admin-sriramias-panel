import { useMemo } from 'react'
import { CbtAdminTable, CbtEvaluationStatusPill } from './ui'
import {
  CBT_TABLE_CELL_CENTER,
  CBT_TABLE_CELL_LEFT,
  CBT_TABLE_HEADER,
} from './ui/cbtTableStyles'
import CbtTestsTableActions from './CbtTestsTableActions'

export default function CbtTestsManagementTable({
  tests,
  loading,
  resetDeps = [],
  emptyMessage,
  onViewTest,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: 'Test Name',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[220px] pl-5 text-left`,
        cellClassName: `${CBT_TABLE_CELL_LEFT} min-w-[220px] pl-5`,
        render: (row) => (
          <span
            className="block truncate font-semibold text-slate-900"
            title={row.title || ''}
          >
            {row.title || '—'}
          </span>
        ),
      },
      {
        key: 'uploadedDate',
        label: 'Uploaded Date',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[150px] text-left`,
        cellClassName: `${CBT_TABLE_CELL_LEFT} min-w-[150px] font-medium text-[#686868]`,
        render: (row) => row.uploadedDate || '—',
      },
      {
        key: 'studentsAssigned',
        label: 'Students Assigned',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[160px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[160px] font-medium tabular-nums text-[#111]`,
        render: (row) => row.studentsAssigned ?? 0,
      },
      {
        key: 'studentsDownloaded',
        label: 'PDF Downloads',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[140px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[140px] font-medium tabular-nums text-[#111]`,
        render: (row) => row.studentsDownloaded ?? 0,
      },
      {
        key: 'studentsUploaded',
        label: 'Answer Sheets Uploaded',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[190px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[190px] font-medium tabular-nums text-[#111]`,
        render: (row) => row.studentsUploaded ?? 0,
      },
      {
        key: 'evaluationStatus',
        label: 'Evaluation Status',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[170px] text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[170px]`,
        render: (row) => (
          <div className="flex justify-center">
            <CbtEvaluationStatusPill
              status={row.evaluationStatusLabel || row.evaluationStatus}
            />
          </div>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'center',
        headerTruncate: false,
        headerClassName: `${CBT_TABLE_HEADER} min-w-[120px] pr-5 text-center`,
        cellClassName: `${CBT_TABLE_CELL_CENTER} min-w-[120px] pr-5`,
        render: (row) => <CbtTestsTableActions onView={() => onViewTest?.(row)} />,
      },
    ],
    [onViewTest],
  )

  return (
    <CbtAdminTable
      columns={columns}
      data={tests}
      emptyMessage={emptyMessage}
      itemLabel="tests"
      loading={loading}
      skeletonRowCount={6}
      initialPageSize={10}
      resetDeps={resetDeps}
      tableMinWidth={1100}
    />
  )
}
