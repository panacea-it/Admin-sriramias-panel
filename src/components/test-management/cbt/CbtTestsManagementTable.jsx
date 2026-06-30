import { useMemo } from 'react'
import { CbtAdminTable, CbtEvaluationStatusPill } from './ui'
import { createActionsColumn } from '../../../utils/tableColumnHelpers'
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
        headerClassName: 'min-w-[220px]',
        cellClassName: 'min-w-[220px] align-middle',
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
        key: 'uploadedDate',
        label: 'Uploaded Date',
        headerClassName: 'min-w-[130px] whitespace-nowrap',
        cellClassName: 'min-w-[130px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">{row.uploadedDate || '—'}</span>
        ),
      },
      {
        key: 'studentsAssigned',
        label: 'Students Assigned',
        align: 'center',
        headerClassName: 'min-w-[150px] whitespace-nowrap text-center',
        cellClassName: 'min-w-[150px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">{row.studentsAssigned ?? 0}</span>
        ),
      },
      {
        key: 'studentsDownloaded',
        label: 'PDF Downloads',
        align: 'center',
        headerClassName: 'min-w-[130px] whitespace-nowrap text-center',
        cellClassName: 'min-w-[130px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">{row.studentsDownloaded ?? 0}</span>
        ),
      },
      {
        key: 'studentsUploaded',
        label: 'Answer Sheets Uploaded',
        align: 'center',
        headerClassName: 'min-w-[180px] whitespace-nowrap text-center',
        cellClassName: 'min-w-[180px] whitespace-nowrap align-middle text-center',
        render: (row) => (
          <span className="font-medium tabular-nums text-[#111]">{row.studentsUploaded ?? 0}</span>
        ),
      },
      {
        key: 'evaluationStatus',
        label: 'Evaluation Status',
        align: 'center',
        headerClassName: 'min-w-[150px] whitespace-nowrap text-center',
        cellClassName: 'min-w-[150px] align-middle text-center',
        render: (row) => (
          <div className="flex w-full items-center justify-center">
            <CbtEvaluationStatusPill
              status={row.evaluationStatusLabel || row.evaluationStatus}
            />
          </div>
        ),
      },
      createActionsColumn({
        buttonCount: 1,
        align: 'center',
        render: (row) => <CbtTestsTableActions onView={() => onViewTest?.(row)} />,
      }),
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
      skeletonRowCount={8}
      initialPageSize={10}
      resetDeps={resetDeps}
      fullWidth
    />
  )
}
