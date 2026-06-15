import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import TestActivityStatusBadge from './TestActivityStatusBadge'
import { cn } from '../../utils/cn'

const TABLE_PAGINATION_CLASS = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

function parseFacultyLabel(faculty) {
  const trimmed = String(faculty || '').trim()
  if (!trimmed) return { name: '—', subject: '' }

  const dashIndex = trimmed.indexOf(' - ')
  if (dashIndex === -1) return { name: trimmed, subject: '' }

  return {
    subject: trimmed.slice(0, dashIndex).trim(),
    name: trimmed.slice(dashIndex + 3).trim(),
  }
}

function FacultyCell({ faculty }) {
  const { name, subject } = parseFacultyLabel(faculty)

  return (
    <div className="min-w-0">
      <div className="truncate font-semibold text-slate-900">{name || '—'}</div>
      {subject && (
        <div className="truncate text-[12px] font-medium text-[#686868]">{subject}</div>
      )}
    </div>
  )
}

function getActivityPillClass(action) {
  const text = String(action || '').toLowerCase()
  if (text.includes('publish')) return 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25'
  if (text.includes('attempt')) return 'bg-sky-500/15 text-sky-900 ring-sky-500/25'
  if (text.includes('pending') || text.includes('evaluation')) {
    return 'bg-amber-500/15 text-amber-900 ring-amber-500/25'
  }
  if (text.includes('schedule')) return 'bg-sky-500/15 text-sky-900 ring-sky-500/25'
  if (text.includes('lock')) return 'bg-slate-500/15 text-slate-700 ring-slate-500/25'
  return 'bg-[#55ace7]/15 text-[#246392] ring-[#55ace7]/25'
}

function ActivityPill({ action }) {
  const label = action?.trim() ? action : '—'

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset',
        label === '—'
          ? 'bg-slate-500/15 text-slate-600 ring-slate-500/25'
          : getActivityPillClass(label),
      )}
      title={label}
    >
      <span className="truncate">{label}</span>
    </span>
  )
}

export default function RecentTestActivitiesTable({
  data,
  emptyMessage = 'No recent test activities.',
  resetDeps = [],
  initialPageSize = 10,
  loading = false,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'test',
        label: 'Test',
        width: '30%',
        headerTruncate: false,
        headerClassName: 'min-w-[180px] whitespace-nowrap',
        cellClassName: 'min-w-[180px] align-middle',
        render: (row) => (
          <span
            className="block truncate font-semibold text-slate-900"
            title={row.test || ''}
          >
            {row.test || '—'}
          </span>
        ),
      },
      {
        key: 'faculty',
        label: 'Faculty',
        width: '18%',
        headerTruncate: false,
        headerClassName: 'min-w-[140px] whitespace-nowrap',
        cellClassName: 'min-w-[140px] align-middle',
        render: (row) => <FacultyCell faculty={row.faculty} />,
      },
      {
        key: 'action',
        label: 'Activity',
        width: '22%',
        headerTruncate: false,
        headerClassName: 'min-w-[160px] whitespace-nowrap',
        cellClassName: 'min-w-[160px] align-middle',
        render: (row) => <ActivityPill action={row.action} />,
      },
      {
        key: 'time',
        label: 'Time',
        width: '15%',
        headerTruncate: false,
        headerClassName: 'min-w-[100px] whitespace-nowrap',
        cellClassName: 'min-w-[100px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#686868]">{row.time || '—'}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: '15%',
        align: 'center',
        headerTruncate: false,
        headerClassName: 'min-w-[110px] whitespace-nowrap text-center',
        cellClassName: 'min-w-[110px] align-middle text-center',
        render: (row) => <TestActivityStatusBadge status={row.status} />,
      },
    ],
    [],
  )

  return (
    <PaginatedFigmaTable
      className="w-full shadow-none"
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      itemLabel="activities"
      initialPageSize={initialPageSize}
      resetDeps={resetDeps}
      loading={loading}
      skeletonRowCount={5}
      density="comfortable"
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={880}
      paginationClassName={TABLE_PAGINATION_CLASS}
    />
  )
}
