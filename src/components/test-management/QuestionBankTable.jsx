import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import QuestionTableActions from './QuestionTableActions'
import { cn } from '../../utils/cn'
import { getQuestionPreviewText } from '../../utils/testManagementQuestionForm'

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

export default function QuestionBankTable({
  rows,
  loading,
  resetDeps = [],
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
        key: 'id',
        label: 'Question ID',
        width: '12%',
        headerTruncate: false,
        headerClassName: 'min-w-[108px] whitespace-nowrap px-4 sm:px-5',
        cellClassName: 'min-w-[108px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-semibold text-slate-900">{row.questionCode || row.id || '—'}</span>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        width: '12%',
        headerTruncate: false,
        headerClassName: 'min-w-[100px] whitespace-nowrap px-4 sm:px-5',
        cellClassName: 'min-w-[100px] whitespace-nowrap align-middle',
        render: (row) => (
          <span className="font-medium text-[#111]">{row.type || '—'}</span>
        ),
      },
      {
        key: 'subject',
        label: 'Subject',
        width: '12%',
        headerTruncate: false,
        headerClassName: 'min-w-[100px] whitespace-nowrap px-4 sm:px-5',
        cellClassName: 'min-w-[100px] align-middle',
        render: (row) => (
          <span
            className="block truncate font-medium text-[#111]"
            title={row.subject || ''}
          >
            {row.subject || '—'}
          </span>
        ),
      },
      {
        key: 'topic',
        label: 'Topic',
        width: '12%',
        headerTruncate: false,
        headerClassName: 'min-w-[100px] whitespace-nowrap px-4 sm:px-5',
        cellClassName: 'min-w-[100px] align-middle',
        render: (row) => (
          <span
            className="block truncate font-medium text-[#111]"
            title={row.topic || ''}
          >
            {row.topic || '—'}
          </span>
        ),
      },
      {
        key: 'difficulty',
        label: 'Difficulty',
        width: '10%',
        align: 'center',
        headerTruncate: false,
        headerClassName: 'min-w-[96px] whitespace-nowrap px-4 text-center sm:px-5',
        cellClassName: 'min-w-[96px] align-middle text-center',
        render: (row) => <DifficultyBadge difficulty={row.difficulty} />,
      },
      {
        key: 'preview',
        label: 'Question Preview',
        width: '30%',
        headerTruncate: false,
        headerClassName: 'min-w-[180px] whitespace-nowrap px-4 sm:px-5',
        cellClassName: 'min-w-[180px] align-middle',
        render: (row) => {
          const preview = getQuestionPreviewText(row)
          return (
            <span
              title={preview}
              className="block truncate text-left text-[13px] font-medium text-[#111]"
            >
              {preview || '—'}
            </span>
          )
        },
      },
      {
        key: 'actions',
        label: 'Actions',
        width: '12%',
        align: 'center',
        headerTruncate: false,
        headerClassName: 'min-w-[200px] whitespace-nowrap px-4 text-center sm:px-6',
        cellClassName: 'min-w-[200px] whitespace-nowrap align-middle px-4 sm:px-6',
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
      initialPageSize={10}
      resetDeps={resetDeps}
      density="comfortable"
      zebraStriping
      rowClassName="hover:bg-[#eef6fc]/70"
      tableClassName="rounded-none border-0 shadow-none"
      tableMinWidth={880}
      paginationClassName={TABLE_PAGINATION_CLASS}
    />
  )
}
