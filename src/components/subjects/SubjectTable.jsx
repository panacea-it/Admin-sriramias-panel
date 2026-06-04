import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { facultySubjectLabels } from '../../data/facultySubjectLabels'
import SubjectStatusToggle from './SubjectStatusToggle'
import { SubjectRowActions } from './ActionButtons'
import TableValueChips from './TableValueChips'
import {
  deriveLiveStatus,
  deriveRecordingStatus,
  deriveTestSeriesStatus,
  normalizeCategories,
} from '../../utils/subjectCategoryHelpers'
import { normalizeTestSeriesBlock } from '../../utils/batchTestSeriesForm'
import { parseDateForDisplay } from '../../utils/academicsSubjectsStorage'

function IdCell({ id, selected, onToggleSelect }) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="checkbox"
        checked={Boolean(selected)}
        onChange={() => onToggleSelect?.(String(id))}
        aria-label={`Select subject ${id}`}
        className="h-4 w-4 shrink-0 cursor-pointer rounded border-[#55ace7]/40 text-[#246392] focus:ring-[#55ace7]/50"
      />
      <span className="font-mono text-sm font-semibold text-[#111]">{id}</span>
    </div>
  )
}

export default function SubjectTable({
  data,
  onAddRow,
  onViewList,
  onEdit,
  onDelete,
  onStatusChange,
  search,
  statusFilter,
  selectedIds = [],
  onToggleSelect,
  emptyMessage = `No ${facultySubjectLabels.plural.toLowerCase()} found.`,
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
      key: 'subjectName',
      label: facultySubjectLabels.singular,
      render: (row) => (
        <span className="font-semibold text-[#111]">{row.subjectName}</span>
      ),
    },
    {
      key: 'teacher',
      label: 'Teacher',
      render: (row) => <span className="text-sm text-[#444]">{row.teacher || '—'}</span>,
    },
    {
      key: 'categories',
      label: 'Categories',
      render: (row) => (
        <TableValueChips values={normalizeCategories(row.categories ?? row.category)} />
      ),
    },
    {
      key: 'liveStatus',
      label: 'Live Class Status',
      render: (row) => (
        <span className="text-sm text-[#444]">{deriveLiveStatus(row)}</span>
      ),
    },
    {
      key: 'recordingStatus',
      label: 'Recording Status',
      render: (row) => (
        <span className="text-sm text-[#444]">{deriveRecordingStatus(row)}</span>
      ),
    },
    {
      key: 'testSeriesStatus',
      label: 'Test Series Status',
      render: (row) => (
        <span className="text-sm text-[#444]">{deriveTestSeriesStatus(row)}</span>
      ),
    },
    {
      key: 'totalQuestions',
      label: 'Total Questions',
      render: (row) => {
        const ts = row.testSeries ? normalizeTestSeriesBlock(row.testSeries) : null
        const count = ts?.questions?.length ?? 0
        return <span className="text-sm font-medium text-[#444]">{count || '—'}</span>
      },
    },
    {
      key: 'scheduledDate',
      label: 'Scheduled Date',
      render: (row) => {
        const ts = row.testSeries ? normalizeTestSeriesBlock(row.testSeries) : null
        const date = ts?.schedule?.date || ts?.scheduleDate
        const time = ts?.schedule?.time || ts?.scheduleTime
        if (!date) return <span className="text-sm text-[#444]">—</span>
        return (
          <span className="text-sm text-[#444]">
            {parseDateForDisplay(date)}
            {time ? ` · ${time}` : ''}
          </span>
        )
      },
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
      label: 'Actions',
      headerClassName: 'whitespace-nowrap text-center',
      cellClassName: 'align-middle whitespace-nowrap',
      render: (row) => (
        <div className="flex justify-center py-1">
          <SubjectRowActions
            onAdd={() => onAddRow(row)}
            onViewList={() => onViewList(row)}
            onEdit={() => onEdit(row)}
            onDelete={() => onDelete(row)}
          />
        </div>
      ),
    },
  ]

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      itemLabel="subjects"
      resetDeps={[search, statusFilter]}
      rowClassName="transition-colors hover:bg-[#f8fbff]"
    />
  )
}
