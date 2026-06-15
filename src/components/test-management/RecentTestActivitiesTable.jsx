import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import TestActivityStatusBadge from './TestActivityStatusBadge'
import { cn } from '../../utils/cn'

const RECENT_ACTIVITIES_TABLE_MIN_WIDTH = 960

const COLUMN = {
  test: 280,
  faculty: 220,
  activity: 220,
  time: 130,
  status: 150,
}

const CELL = 'align-middle'

const TABLE_CLASS = cn(
  'rounded-none border-0 shadow-none',
  '[&_thead_tr]:!bg-gradient-to-r [&_thead_tr]:!from-[#7eb8e8] [&_thead_tr]:!to-[#55ace7]',
  '[&_thead_tr]:shadow-[0_2px_8px_rgba(85,172,231,0.25)]',
  '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap [&_thead_th]:!bg-transparent',
  '[&_thead_th]:text-white [&_thead_th]:text-xs [&_thead_th]:font-bold sm:[&_thead_th]:text-sm',
  '[&_tbody_td]:align-middle',
)

function TruncatedTextCell({ value, className, tooltipClassName }) {
  const text = value?.trim() ? value : '—'
  const showTooltip = text !== '—' && text.length > 28

  return (
    <div className="group/tip relative w-full min-w-0 max-w-full">
      <span
        className={cn(
          'block truncate text-sm leading-snug',
          text === '—' ? 'text-[#9ca0a8]' : 'text-[#111111]',
          className,
        )}
      >
        {text}
      </span>
      {showTooltip && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-30 max-w-[min(18rem,calc(100vw-2rem))]',
            'rounded-lg bg-[#1a3a5c] px-3 py-2 text-left text-xs font-medium leading-snug text-white shadow-[0_8px_24px_rgba(15,23,42,0.22)]',
            'scale-95 whitespace-normal opacity-0 transition-all duration-200 ease-out',
            'group-hover/tip:scale-100 group-hover/tip:opacity-100',
            tooltipClassName,
          )}
        >
          {text}
        </span>
      )}
    </div>
  )
}

function parseFacultyLabel(faculty) {
  const trimmed = String(faculty || '').trim()
  if (!trimmed) return { subject: '—', name: '' }
  const dashIndex = trimmed.indexOf(' - ')
  if (dashIndex === -1) return { subject: trimmed, name: '' }
  return {
    subject: trimmed.slice(0, dashIndex).trim(),
    name: trimmed.slice(dashIndex + 3).trim(),
  }
}

function FacultyCell({ faculty }) {
  const { subject, name } = parseFacultyLabel(faculty)
  const fullLabel = name ? `${subject} · ${name}` : subject
  const showTooltip = fullLabel.length > 24

  return (
    <div className="group/tip relative w-full min-w-0 max-w-full leading-snug">
      <div className="truncate">
        <span className="text-sm font-semibold text-[#111111]">{subject}</span>
        {name && (
          <>
            <span className="text-[#9ca0a8]"> · </span>
            <span className="text-sm text-[#686868]">{name}</span>
          </>
        )}
      </div>
      {showTooltip && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute bottom-[calc(100%+6px)] left-0 z-30 max-w-[min(18rem,calc(100vw-2rem))]',
            'rounded-lg bg-[#1a3a5c] px-3 py-2 text-left text-xs font-medium leading-snug text-white shadow-[0_8px_24px_rgba(15,23,42,0.22)]',
            'scale-95 whitespace-normal opacity-0 transition-all duration-200 ease-out',
            'group-hover/tip:scale-100 group-hover/tip:opacity-100',
          )}
        >
          {fullLabel}
        </span>
      )}
    </div>
  )
}

function getActivityBadgeClass(action) {
  const text = String(action || '').toLowerCase()
  if (text.includes('publish')) return 'bg-emerald-50 text-emerald-800 ring-emerald-200/80'
  if (text.includes('attempt')) return 'bg-blue-50 text-blue-800 ring-blue-200/80'
  if (text.includes('pending') || text.includes('evaluation')) {
    return 'bg-amber-50 text-amber-800 ring-amber-200/80'
  }
  if (text.includes('schedule')) return 'bg-sky-50 text-sky-800 ring-sky-200/80'
  if (text.includes('lock')) return 'bg-slate-100 text-slate-700 ring-slate-200/80'
  return 'bg-[#eef6fc] text-[#246392] ring-[#55ace7]/20'
}

function ActivityBadge({ action }) {
  const label = action?.trim() ? action : '—'
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-semibold leading-snug ring-1',
        label === '—' ? 'bg-slate-50 text-[#9ca0a8] ring-slate-200/80' : getActivityBadgeClass(label),
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  )
}

function TimeCell({ time }) {
  return (
    <span className="block whitespace-nowrap text-center text-sm text-[#9ca0a8]">
      {time?.trim() ? time : '—'}
    </span>
  )
}

export default function RecentTestActivitiesTable({
  data,
  emptyMessage = 'No recent test activities.',
  resetDeps = [],
  initialPageSize = 10,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'test',
        label: 'Test',
        width: COLUMN.test,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <TruncatedTextCell value={row.test} className="font-semibold text-[#111111]" />
        ),
      },
      {
        key: 'faculty',
        label: 'Faculty',
        width: COLUMN.faculty,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <FacultyCell faculty={row.faculty} />,
      },
      {
        key: 'action',
        label: 'Activity',
        width: COLUMN.activity,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <ActivityBadge action={row.action} />,
      },
      {
        key: 'time',
        label: 'Time',
        width: COLUMN.time,
        align: 'center',
        headerTruncate: false,
        headerClassName: cn(CELL, 'text-center'),
        cellClassName: cn(CELL, 'text-center'),
        render: (row) => <TimeCell time={row.time} />,
      },
      {
        key: 'status',
        label: 'Status',
        width: COLUMN.status,
        align: 'center',
        headerTruncate: false,
        headerClassName: cn(CELL, 'text-center'),
        cellClassName: cn(CELL, 'text-center'),
        render: (row) => (
          <div className="flex w-full items-center justify-center">
            <TestActivityStatusBadge status={row.status} />
          </div>
        ),
      },
    ],
    [],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      itemLabel="activities"
      initialPageSize={initialPageSize}
      resetDeps={resetDeps}
      rowClassName="hover:bg-[#eef6fc]/70"
      zebraStriping
      density="comfortable"
      tableMinWidth={RECENT_ACTIVITIES_TABLE_MIN_WIDTH}
      tableLayoutFixed
      gradientActivePage
      className="w-full overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
      tableClassName={TABLE_CLASS}
      paginationClassName="border-t border-[#E5E7EB] bg-white"
    />
  )
}
