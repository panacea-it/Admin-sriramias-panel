import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { StatusBadge } from '../academics/AcademicsUi'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { createActionsColumn } from '../../utils/tableColumnHelpers'

function formatCenterName(centerName) {
  const value = String(centerName || '').trim()
  return value || 'Not Assigned'
}

export default function AdminManagementTable({
  users,
  loading,
  controlledPagination,
  selection,
  resetDeps = [],
  emptyMessage,
  emptyState,
  renderActions,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'employeeName',
        label: 'Employee Name',
        headerClassName: 'pl-6 sm:pl-8',
        cellClassName: 'pl-6 sm:pl-8 font-medium',
      },
      {
        key: 'employeeId',
        label: 'Employee Number / Employee ID',
      },
      {
        key: 'roleTitle',
        label: 'Role Title',
      },
      {
        key: 'centerName',
        label: 'Center',
        render: (row) => (
          <span className="font-medium text-[#111]">{formatCenterName(row.centerName)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        render: (row) => (
          <span className="text-[#686868]">{formatCategoryDateTime(row.createdAt)}</span>
        ),
      },
      createActionsColumn({
        buttonCount: 3,
        align: 'right',
        render: (row) => renderActions(row),
      }),
    ],
    [renderActions],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={users}
      emptyMessage={emptyMessage}
      emptyState={emptyState}
      itemLabel="employees"
      loading={loading}
      skeletonRowCount={8}
      controlledPagination={controlledPagination}
      resetDeps={resetDeps}
      selection={selection}
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={1080}
    />
  )
}
