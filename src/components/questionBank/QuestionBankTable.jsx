import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import QuestionTableActions from '../test-management/QuestionTableActions'
import QuestionBankStatusBadge from './StatusBadge'
import { cn } from '../../utils/cn'

const TABLE_PAGINATION_CLASS = cn(
  '[&>div:last-child]:items-center',
  '[&_nav]:items-center',
  '[&_form]:flex [&_form]:items-center [&_form]:gap-2',
  '[&_form_input]:h-9 [&_form_input]:leading-none',
  '[&_form_button]:inline-flex [&_form_button]:h-9 [&_form_button]:items-center [&_form_button]:justify-center',
)

const DIFFICULTY_STYLES = {
  Easy: 'bg-emerald-500/15 text-emerald-800 ring-emerald-500/25',
  Medium: 'bg-orange-500/15 text-orange-900 ring-orange-500/25',
  Hard: 'bg-red-500/15 text-red-800 ring-red-500/25',
}

function DifficultyBadge({ difficulty }) {
  const label = difficulty || 'Medium'
  return (
    <span
      className={cn(
        'inline-flex min-w-[72px] items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset',
        DIFFICULTY_STYLES[label] ?? DIFFICULTY_STYLES.Medium,
      )}
    >
      {label}
    </span>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

export default function QuestionBankTable({
  rows,
  loading,
  controlledPagination,
  emptyMessage = 'No questions found.',
  onView,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'questionCode',
        label: 'Code',
        width: '10%',
        render: (row) => (
          <span className="font-semibold text-slate-900">{row.questionCode || row.id || '—'}</span>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        width: '10%',
        render: (row) => <span className="font-medium text-[#111]">{row.type || '—'}</span>,
      },
      {
        key: 'category',
        label: 'Category',
        width: '8%',
        render: (row) => <span className="font-medium text-[#111]">{row.category || '—'}</span>,
      },
      {
        key: 'subject',
        label: 'Subject',
        width: '10%',
        render: (row) => (
          <span className="block truncate font-medium text-[#111]" title={row.subject || ''}>
            {row.subject || '—'}
          </span>
        ),
      },
      {
        key: 'topic',
        label: 'Topic',
        width: '10%',
        render: (row) => (
          <span className="block truncate font-medium text-[#111]" title={row.topic || ''}>
            {row.topic || '—'}
          </span>
        ),
      },
      {
        key: 'difficulty',
        label: 'Difficulty',
        width: '8%',
        align: 'center',
        render: (row) => <DifficultyBadge difficulty={row.difficulty} />,
      },
      {
        key: 'status',
        label: 'Status',
        width: '8%',
        align: 'center',
        render: (row) => <QuestionBankStatusBadge status={row.status} />,
      },
      {
        key: 'usageCount',
        label: 'Usage',
        width: '6%',
        align: 'center',
        render: (row) => <span className="font-semibold text-slate-800">{row.usageCount ?? 0}</span>,
      },
      {
        key: 'preview',
        label: 'Preview',
        width: '18%',
        render: (row) => (
          <span
            title={row.questionPreview || row.content?.question || ''}
            className="block truncate text-left text-[13px] font-medium text-[#111]"
          >
            {row.questionPreview || row.content?.question || '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created',
        width: '8%',
        render: (row) => <span className="text-sm text-slate-700">{formatDate(row.createdAt)}</span>,
      },
      {
        key: 'actions',
        label: 'Actions',
        width: '12%',
        align: 'center',
        render: (row) => (
          <QuestionTableActions
            row={row}
            onView={() => onView(row)}
            onEdit={() => onEdit(row)}
            onDuplicate={() => onDuplicate(row)}
            onToggleStatus={() => onToggleStatus(row)}
            onDelete={() => onDelete(row)}
          />
        ),
      },
    ],
    [onView, onEdit, onDuplicate, onToggleStatus, onDelete],
  )

  return (
    <PaginatedFigmaTable
      className="w-full shadow-none"
      columns={columns}
      data={rows}
      loading={loading}
      skeletonRowCount={8}
      emptyMessage={emptyMessage}
      itemLabel="questions"
      controlledPagination={controlledPagination}
      density="comfortable"
      zebraStriping
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={1180}
      paginationClassName={TABLE_PAGINATION_CLASS}
    />
  )
}
