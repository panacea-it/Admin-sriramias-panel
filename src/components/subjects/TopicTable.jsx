import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import SubjectStatusToggle from './SubjectStatusToggle'
import { TopicRowActions } from './ActionButtons'
import { parseDateForDisplay } from '../../utils/academicsSubjectsStorage'

function IdCell({ id, selected, onToggleSelect }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={Boolean(selected)}
        onChange={() => onToggleSelect?.(String(id))}
        aria-label={`Select live class ${id}`}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#55ace7]/40 text-[#246392] focus:ring-[#55ace7]/50"
      />
      <span className="font-mono text-sm font-semibold text-[#111]">{id}</span>
    </div>
  )
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
  emptyMessage = 'No live classes found.',
}) {
  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (row) => (
        <IdCell
          id={row.id}
          selected={selectedIds.includes(String(row.id))}
          onToggleSelect={onToggleSelect}
        />
      ),
    },
    {
      key: 'classTitle',
      label: 'Class Title',
      render: (row) => (
        <div>
          <span className="font-semibold text-[#111]">{row.classTitle}</span>
          {row.recurring || row.recurrenceSeriesId ? (
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-[#246392]">
              Recurring
              {row.occurrenceCount ? ` · ${row.occurrenceCount} sessions` : ''}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'center',
      label: 'Center',
      render: (row) => <span className="text-sm text-[#444]">{row.center || '—'}</span>,
    },
    {
      key: 'classroom',
      label: 'Classroom',
      render: (row) => (
        <span className="text-sm text-[#444]">{row.classroom || '—'}</span>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (row) => (
        <span className="whitespace-nowrap text-sm">{parseDateForDisplay(row.date)}</span>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-[#444]">{row.duration || '—'}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <SubjectStatusToggle
          status={row.status}
          onChange={(next) => onStatusChange?.(row, next)}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <TopicRowActions
          onEdit={() => onEdit(row)}
          onDelete={() => onDelete(row)}
        />
      ),
    },
  ]

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      itemLabel="classes"
      resetDeps={[search, statusFilter, categoryFilter]}
      rowClassName="transition-colors hover:bg-[#f8fbff]"
    />
  )
}
