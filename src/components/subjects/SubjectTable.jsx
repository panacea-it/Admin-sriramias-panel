import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { facultySubjectLabels } from '../../data/facultySubjectLabels'
import SubjectListingStatus from './SubjectListingStatus'
import SubjectRowActionsMenu, { tableActionsCellClass } from './SubjectRowActionsMenu'
import SubjectChipPopover from './SubjectChipPopover'
import AdminTooltip from './AdminTooltip'
import {
  deriveLiveStatus,
  deriveRecordingStatus,
  deriveTestSeriesStatus,
  normalizeCategories,
} from '../../utils/subjectCategoryHelpers'
import { normalizeTestSeriesBlock } from '../../utils/batchTestSeriesForm'
import { parseDateForDisplay } from '../../utils/academicsSubjectsStorage'

function SecondaryCell({ children, title }) {
  return (
    <span className="text-xs text-slate-600" title={title}>
      {children}
    </span>
  )
}

export default function SubjectTable({
  data,
  onAddRow,
  onView,
  onViewList,
  onEdit,
  onDelete,
  onStatusChange,
  search,
  statusFilter,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectPage,
  emptyMessage = `No ${facultySubjectLabels.plural.toLowerCase()} found.`,
  loading = false,
  controlledPagination,
  statusChangingId,
}) {
  const columns = [
    {
      key: 'id',
      label: 'ID',
      headerClassName: 'w-[88px]',
      cellClassName: 'w-[88px]',
      render: (row) => (
        <AdminTooltip label={`Subject ID: ${row.displayId || row.facultySubjectId || row.id}`}>
          <span className="font-mono text-xs font-bold tracking-tight text-[#1a3a5c]">
            {row.displayId || row.facultySubjectId || row.id}
          </span>
        </AdminTooltip>
      ),
    },
    {
      key: 'subjectName',
      label: facultySubjectLabels.singular,
      headerClassName: 'min-w-[140px]',
      render: (row) => (
        <span className="text-sm font-bold text-[#111]">{row.subjectName}</span>
      ),
    },
    {
      key: 'teacher',
      label: 'Teacher',
      headerClassName: 'min-w-[120px]',
      render: (row) => (
        <SecondaryCell title={row.teacher}>{row.teacher || '—'}</SecondaryCell>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'min-w-[130px]',
      render: (row) => (
        <SubjectListingStatus
          status={row.status}
          disabled={statusChangingId === row.id}
          onChange={(next) => onStatusChange?.(row, next)}
        />
      ),
    },
    {
      key: 'topics',
      label: 'Topics',
      headerClassName: 'min-w-[150px] hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell',
      render: (row) => (
        <SubjectChipPopover
          values={Array.isArray(row.topics) ? row.topics : row.topic ? [row.topic] : []}
          tooltipLabel="All topics"
        />
      ),
    },
    {
      key: 'categories',
      label: 'Categories',
      headerClassName: 'min-w-[150px] hidden md:table-cell',
      cellClassName: 'hidden md:table-cell',
      render: (row) => (
        <SubjectChipPopover
          values={normalizeCategories(row.categories ?? row.category)}
          tooltipLabel="All categories"
        />
      ),
    },
    {
      key: 'liveStatus',
      label: 'Live',
      headerClassName: 'hidden xl:table-cell w-[90px]',
      cellClassName: 'hidden xl:table-cell',
      render: (row) => (
        <SecondaryCell>{deriveLiveStatus(row)}</SecondaryCell>
      ),
    },
    {
      key: 'recordingStatus',
      label: 'Recording',
      headerClassName: 'hidden xl:table-cell w-[90px]',
      cellClassName: 'hidden xl:table-cell',
      render: (row) => (
        <SecondaryCell>{deriveRecordingStatus(row)}</SecondaryCell>
      ),
    },
    {
      key: 'testSeriesStatus',
      label: 'Test',
      headerClassName: 'hidden 2xl:table-cell w-[100px]',
      cellClassName: 'hidden 2xl:table-cell',
      render: (row) => (
        <SecondaryCell>{deriveTestSeriesStatus(row)}</SecondaryCell>
      ),
    },
    {
      key: 'totalQuestions',
      label: 'Questions',
      headerClassName: 'hidden 2xl:table-cell w-[88px] text-center',
      cellClassName: 'hidden 2xl:table-cell text-center',
      render: (row) => {
        const ts = row.testSeries ? normalizeTestSeriesBlock(row.testSeries) : null
        const count = ts?.questions?.length ?? 0
        return <SecondaryCell>{count || '—'}</SecondaryCell>
      },
    },
    {
      key: 'scheduledDate',
      label: 'Scheduled',
      headerClassName: 'hidden 2xl:table-cell min-w-[120px]',
      cellClassName: 'hidden 2xl:table-cell',
      render: (row) => {
        const ts = row.testSeries ? normalizeTestSeriesBlock(row.testSeries) : null
        const date = ts?.schedule?.date || ts?.scheduleDate
        const time = ts?.schedule?.time || ts?.scheduleTime
        if (!date) return <SecondaryCell>—</SecondaryCell>
        return (
          <SecondaryCell>
            {parseDateForDisplay(date)}
            {time ? ` · ${time}` : ''}
          </SecondaryCell>
        )
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      cellClassName: tableActionsCellClass,
      render: (row) => (
        <SubjectRowActionsMenu
          onView={() => onView?.(row)}
          onEdit={() => onEdit(row)}
          onAdd={() => onAddRow(row)}
          onViewList={() => onViewList(row)}
          onDelete={() => onDelete(row)}
        />
      ),
    },
  ]

  const selection =
    onToggleSelect && onToggleSelectPage
      ? {
          selectedIds,
          onToggle: onToggleSelect,
          onTogglePage: onToggleSelectPage,
          getRowId: (row) => String(row.id),
        }
      : undefined

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      itemLabel="subjects"
      resetDeps={[search, statusFilter]}
      rowClassName="cursor-default transition-colors duration-200 hover:bg-[#eef6fc]/80"
      loading={loading}
      controlledPagination={controlledPagination}
      selection={selection}
      density="compact"
      zebraStriping
      stickyHeader
      stickyLastColumn
      animateRows
      skeletonRowCount={8}
      tableMinWidth={960}
      className="overflow-hidden rounded-xl border border-slate-100/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)]"
      tableClassName="rounded-xl"
    />
  )
}
