import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import AdminTooltip from './AdminTooltip'
import LiveClassListingStatus from './LiveClassListingStatus'
import TopicRowActionsMenu from './TopicRowActionsMenu'
import { parseDateForDisplay } from '../../utils/academicsSubjectsStorage'
import { tableActionsCellClass } from '../common/TableActionMenu'

function truncateId(id, visible = 10) {
  const value = String(id || '')
  if (value.length <= visible + 1) return value
  return `${value.slice(0, visible)}…`
}

export default function TopicTable({
  data,
  onEdit,
  onDelete,
  onStatusChange,
  search,
  statusFilter,
  categoryFilter,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectPage,
  emptyMessage = 'No live classes found.',
  loading = false,
}) {
  const columns = [
    {
      key: 'id',
      label: 'ID',
      headerClassName: 'w-[100px]',
      cellClassName: 'w-[100px] max-w-[100px]',
      render: (row) => (
        <AdminTooltip label={`Full ID: ${row.id}`}>
          <span className="block max-w-[88px] truncate font-mono text-xs font-bold text-[#1a3a5c]">
            {truncateId(row.id)}
          </span>
        </AdminTooltip>
      ),
    },
    {
      key: 'classTitle',
      label: 'Class Title',
      headerClassName: 'min-w-[160px]',
      render: (row) => (
        <div className="min-w-0">
          <span className="text-sm font-bold text-[#111]">{row.classTitle}</span>
          {row.recurring || row.recurrenceSeriesId ? (
            <span className="mt-1 inline-flex rounded-full bg-[#eef2fc] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#246392] ring-1 ring-[#55ace7]/15">
              Recurring
              {row.occurrenceCount ? ` · ${row.occurrenceCount}` : ''}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'center',
      label: 'Center',
      headerClassName: 'hidden sm:table-cell min-w-[100px]',
      cellClassName: 'hidden sm:table-cell',
      render: (row) => <span className="text-xs text-slate-600">{row.center || '—'}</span>,
    },
    {
      key: 'classroom',
      label: 'Classroom',
      headerClassName: 'hidden md:table-cell min-w-[100px]',
      cellClassName: 'hidden md:table-cell',
      render: (row) => <span className="text-xs text-slate-600">{row.classroom || '—'}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      headerClassName: 'min-w-[110px]',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-slate-600">
          {parseDateForDisplay(row.date)}
        </span>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      headerClassName: 'hidden lg:table-cell min-w-[100px]',
      cellClassName: 'hidden lg:table-cell',
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-slate-600">{row.duration || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'min-w-[130px]',
      render: (row) => (
        <LiveClassListingStatus
          status={row.status}
          onChange={(next) => onStatusChange?.(row, next)}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      cellClassName: tableActionsCellClass,
      render: (row) => (
        <TopicRowActionsMenu
          onEdit={() => onEdit(row)}
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
      itemLabel="classes"
      resetDeps={[search, statusFilter, categoryFilter]}
      rowClassName="cursor-default transition-colors duration-200 hover:bg-[#eef6fc]/80"
      loading={loading}
      selection={selection}
      density="compact"
      zebraStriping
      stickyHeader
      stickyLastColumn
      animateRows
      skeletonRowCount={6}
      tableMinWidth={880}
      className="overflow-hidden rounded-xl border border-slate-100/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)]"
      tableClassName="rounded-xl"
      paginationClassName="rounded-b-xl bg-slate-50/50"
    />
  )
}
