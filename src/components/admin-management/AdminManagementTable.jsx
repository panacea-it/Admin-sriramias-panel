import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { StatusBadge } from '../academics/AcademicsUi'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { createActionsColumn } from '../../utils/tableColumnHelpers'
import AdminRoleBadge from './AdminRoleBadge'

function formatCenterCell(row) {
  const name = String(row.centerName || '').trim()
  const code = String(row.centerCode || '').trim()
  if (!name || name === '—') return 'Not Assigned'
  if (code) {
    return (
      <span className="block">
        <span className="font-medium text-[#111]">{name}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{code}</span>
      </span>
    )
  }
  return <span className="font-medium text-[#111]">{name}</span>
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
        key: 'fullName',
        label: 'Full Name',
        headerClassName: 'pl-6 sm:pl-8',
        cellClassName: 'pl-6 sm:pl-8 font-medium',
        render: (row) => row.fullName || row.employeeName,
      },
      {
        key: 'officialEmail',
        label: 'Email',
        render: (row) => <span className="text-[#444]">{row.officialEmail}</span>,
      },
      {
        key: 'contactNumber',
        label: 'Contact',
      },
      {
        key: 'employeeId',
        label: 'Employee ID',
      },
      {
        key: 'roleTitle',
        label: 'Role',
        render: (row) => (
          <AdminRoleBadge roleTitle={row.roleTitle} roleCode={row.roleCode} />
        ),
      },
      {
        key: 'centerName',
        label: 'Center',
        render: (row) => formatCenterCell(row),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: 'lastLoginAt',
        label: 'Last Login',
        render: (row) => (
          <span className="text-[#686868]">
            {row.lastLoginAt ? formatCategoryDateTime(row.lastLoginAt) : '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        render: (row) => (
          <span className="text-[#686868]">{formatCategoryDateTime(row.createdAt)}</span>
        ),
      },
      createActionsColumn({
        buttonCount: 4,
        align: 'center',
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
      itemLabel="admins"
      loading={loading}
      skeletonRowCount={8}
      controlledPagination={controlledPagination}
      resetDeps={resetDeps}
      selection={selection}
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={1280}
    />
  )
}
