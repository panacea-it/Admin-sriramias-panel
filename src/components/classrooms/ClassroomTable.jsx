import CategoryStatusBadge from '../categories/CategoryStatusBadge'
import CategoryTableActions from '../categories/CategoryTableActions'
import { formatClassroomDateTime } from '../../utils/classroomApiHelpers'
import { getUsageStats } from '../../api/classroomsAPI'
import { normalizeClassroomStatus } from '../../utils/classroomsStorage'

function OccupancyCell({ classroomId }) {
  let stats = { upcomingBookings: 0, totalBookings: 0 }
  try {
    stats = getUsageStats(classroomId) || stats
  } catch {
    /* safe fallback */
  }
  const pct =
    stats.totalBookings === 0
      ? 0
      : Math.min(
          100,
          Math.round((stats.upcomingBookings / Math.max(stats.totalBookings, 1)) * 100),
        )
  return (
    <div className="flex min-w-[96px] flex-col items-start gap-1">
      <span className="text-xs font-semibold leading-none text-[#246392]">
        {stats.upcomingBookings} upcoming
      </span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#e8f4fc]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#55ace7] to-[#3dad4a]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] leading-none text-[#94a3b8]">{stats.totalBookings} total</span>
    </div>
  )
}

export function buildClassroomTableColumns({ onView, onEdit, onToggle, onDelete }) {
  return [
    {
      key: 'code',
      label: 'Code',
      cellClassName: 'whitespace-nowrap',
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-[#246392]">{row.code}</span>
      ),
    },
    {
      key: 'centerName',
      label: 'Center',
      cellClassName: 'min-w-[120px] max-w-[160px]',
      render: (row) => (
        <span className="block truncate text-sm font-medium text-[#1a3a5c]">
          {row.centerName || '—'}
        </span>
      ),
    },
    {
      key: 'placeName',
      label: 'City / Place',
      cellClassName: 'min-w-[110px] max-w-[150px]',
      render: (row) => (
        <span className="block truncate text-sm text-[#444]">{row.placeName || '—'}</span>
      ),
    },
    {
      key: 'name',
      label: 'Classroom',
      cellClassName: 'min-w-[140px]',
      render: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: row.color || '#246392' }}
          />
          <span className="truncate font-medium text-[#1a3a5c]">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'capacity',
      label: 'Capacity',
      align: 'center',
      cellClassName: 'whitespace-nowrap text-center',
      render: (row) => (
        <span className="text-sm text-[#444]">{row.capacity != null ? row.capacity : '—'}</span>
      ),
    },
    {
      key: 'usage',
      label: 'Usage',
      cellClassName: 'min-w-[108px]',
      render: (row) => <OccupancyCell classroomId={row.id} />,
    },
    {
      key: 'createdAt',
      label: 'Added On',
      cellClassName: 'whitespace-nowrap min-w-[130px]',
      render: (row) => (
        <span className="text-sm text-[#64748b]">{formatClassroomDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      cellClassName: 'min-w-[100px] whitespace-nowrap text-center',
      render: (row) => <CategoryStatusBadge status={normalizeClassroomStatus(row.status)} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      headerClassName: 'min-w-[11rem] text-right',
      cellClassName: 'min-w-[11rem] text-right',
      render: (row) => (
        <CategoryTableActions
          compact
          status={normalizeClassroomStatus(row.status)}
          onView={() => onView(row)}
          onEdit={() => onEdit(row)}
          onToggleStatus={() => onToggle(row)}
          onDelete={() => onDelete(row)}
        />
      ),
    },
  ]
}
