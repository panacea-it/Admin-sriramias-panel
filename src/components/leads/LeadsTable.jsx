import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import LeadTableActions from './LeadTableActions'
import LeadTableSelect from './LeadTableSelect'
import { cn } from '../../utils/cn'

/** Minimum table width — sum of column widths below. */
const LEADS_TABLE_MIN_WIDTH = 1640

const COLUMN = {
  userName: 180,
  email: 250,
  mobile: 150,
  course: 220,
  center: 140,
  date: 170,
  counselor: 180,
  status: 170,
  actions: 180,
}

const CELL = 'align-middle'

function CourseCell({ course, courseSub }) {
  return (
    <div className="leading-snug">
      <span className="block text-sm font-semibold text-[#111111]">{course}</span>
      {courseSub && (
        <span className="mt-0.5 block text-xs text-[#686868]">{courseSub}</span>
      )}
    </div>
  )
}

function DateCell({ time, date }) {
  return (
    <div className="leading-snug">
      <span className="block whitespace-nowrap text-sm text-[#111111]">
        {time}
        <span className="text-[#9ca0a8]"> ,</span>
      </span>
      <span className="mt-0.5 block whitespace-nowrap text-xs text-[#686868]">{date}</span>
    </div>
  )
}

function TextCell({ value, className, mono = false }) {
  const text = value?.trim() ? value : '—'
  return (
    <span
      className={cn(
        'block text-sm leading-snug [overflow-wrap:anywhere]',
        mono && 'font-mono text-xs font-bold tracking-tight text-[#1a3a5c]',
        text === '—' ? 'text-[#9ca0a8]' : 'text-[#111111]',
        className,
      )}
    >
      {text}
    </span>
  )
}

const TABLE_CLASS = cn(
  'rounded-none border-0 shadow-none',
  '[&_thead_tr]:!bg-gradient-to-r [&_thead_tr]:!from-[#7eb8e8] [&_thead_tr]:!to-[#55ace7]',
  '[&_thead_tr]:shadow-[0_2px_8px_rgba(85,172,231,0.25)]',
  '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap [&_thead_th]:!bg-transparent',
  '[&_thead_th]:text-white [&_thead_th]:text-xs [&_thead_th]:font-semibold sm:[&_thead_th]:text-sm',
  '[&_tbody_td]:align-middle',
)

export default function LeadsTable({
  data,
  emptyMessage,
  resetDeps,
  counselorById,
  statusById,
  counselorOptions,
  statusOptions,
  onCounselorChange,
  onStatusChange,
  onView,
  onEdit,
  onDelete,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'userName',
        label: 'User Name',
        width: COLUMN.userName,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <TextCell value={row.userName} className="font-semibold" />,
      },
      {
        key: 'email',
        label: 'Email ID',
        width: COLUMN.email,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <TextCell value={row.email} />,
      },
      {
        key: 'mobile',
        label: 'Mobile Number',
        width: COLUMN.mobile,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <TextCell value={row.mobile} mono />,
      },
      {
        key: 'course',
        label: 'Course Visited',
        width: COLUMN.course,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <CourseCell course={row.course} courseSub={row.courseSub} />,
      },
      {
        key: 'center',
        label: 'Center',
        width: COLUMN.center,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <span className="block text-sm font-medium leading-snug text-[#111111]">{row.center}</span>
        ),
      },
      {
        key: 'date',
        label: 'Date',
        width: COLUMN.date,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <DateCell time={row.time} date={row.date} />,
      },
      {
        key: 'assignedCounselor',
        label: 'Assigned Counselor',
        width: COLUMN.counselor,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <LeadTableSelect
            value={counselorById[row.id] || ''}
            onChange={(value) => onCounselorChange(row.id, value)}
            options={counselorOptions}
            ariaLabel={`Assigned counselor for ${row.userName}`}
            placeholder="Select Counselor"
            variant="counselor"
          />
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: COLUMN.status,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <LeadTableSelect
            value={statusById[row.id] || ''}
            onChange={(value) => onStatusChange(row.id, value)}
            options={statusOptions}
            ariaLabel={`Status for ${row.userName}`}
            placeholder="Select Status"
            variant="status"
          />
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        width: COLUMN.actions,
        align: 'center',
        headerTruncate: false,
        headerClassName: cn(CELL, 'text-center'),
        cellClassName: cn(CELL, 'text-center'),
        render: (row) => (
          <LeadTableActions
            onView={() => onView(row)}
            onEdit={() => onEdit(row)}
            onDelete={() => onDelete(row.id)}
          />
        ),
      },
    ],
    [
      counselorById,
      statusById,
      counselorOptions,
      statusOptions,
      onCounselorChange,
      onStatusChange,
      onView,
      onEdit,
      onDelete,
    ],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      itemLabel="leads"
      resetDeps={resetDeps}
      rowClassName="hover:bg-[#eef6fc]/70"
      zebraStriping
      density="comfortable"
      tableMinWidth={LEADS_TABLE_MIN_WIDTH}
      tableLayoutFixed
      gradientActivePage
      className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
      tableClassName={TABLE_CLASS}
      paginationClassName="border-t border-[#E5E7EB] bg-white"
    />
  )
}
