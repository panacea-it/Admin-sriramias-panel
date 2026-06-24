import { useMemo } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import CategoryStatusBadge from '../../../../components/categories/CategoryStatusBadge'
import ExamCategoryTableActions from '../../../../components/categories/ExamCategoryTableActions'
import CategoryStandardTable from '../../../../components/categories/CategoryStandardTable'
import {
  categoryActionsColumn,
  categoryDateColumn,
  categoryIdColumn,
  categoryNameColumn,
  categoryStatusColumn,
  categoryTruncatedTextColumn,
} from '../../../../components/categories/categoryTableColumns'
import { formatCategoryDateTime } from '../../../../utils/formatDateTime'
import { cn } from '../../../../utils/cn'

function SortableLabel({ label, columnKey, sortBy, sortOrder, onSort, sortKey }) {
  const active = sortBy === sortKey
  const Icon = active ? (sortOrder === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  return (
    <button
      type="button"
      onClick={() => onSort?.(columnKey)}
      className={cn(
        'inline-flex items-center gap-1 font-semibold transition hover:text-white/90',
        active && 'text-white',
      )}
    >
      {label}
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
    </button>
  )
}

function withSortableLabel(column, { sortBy, sortOrder, onSort, sortKey }) {
  return {
    ...column,
    label: (
      <SortableLabel
        label={column.label}
        columnKey={column.key}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={onSort}
        sortKey={sortKey}
      />
    ),
    headerTruncate: false,
  }
}

function SubjectChips({ names = [] }) {
  if (!names.length) return <span className="text-sm text-[#686868]">—</span>

  const visible = names.slice(0, 2)
  const extra = names.length - visible.length

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((name) => (
        <span
          key={name}
          className="inline-flex max-w-[140px] truncate rounded-md bg-[#e8f4fc] px-2 py-0.5 text-xs font-semibold text-[#246392]"
          title={name}
        >
          {name}
        </span>
      ))}
      {extra > 0 ? (
        <span className="text-xs font-semibold text-[#686868]">+{extra}</span>
      ) : null}
    </div>
  )
}

export default function TeacherTable({
  teachers,
  loading,
  controlledPagination,
  sortBy,
  sortOrder,
  onSort,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  resetDeps = [],
  selection,
}) {
  const columns = useMemo(
    () => [
      withSortableLabel(
        categoryIdColumn({
          key: 'displayId',
          label: 'Faculty ID',
          getValue: (row) => row.teacherId || row.displayId || row.id,
        }),
        { sortBy, sortOrder, onSort, sortKey: 'teacherId' },
      ),
      withSortableLabel(categoryNameColumn({ label: 'Faculty Name', key: 'name' }), {
        sortBy,
        sortOrder,
        onSort,
        sortKey: 'teacherName',
      }),
      categoryTruncatedTextColumn({
        key: 'centerName',
        label: 'Center',
        accent: true,
      }),
      {
        key: 'subjects',
        label: 'Subjects',
        render: (row) => (
          <SubjectChips
            names={
              row.subjectNames?.length
                ? row.subjectNames
                : row.subject
                  ? row.subject.split(',').map((s) => s.trim()).filter(Boolean)
                  : []
            }
          />
        ),
      },
      withSortableLabel(
        categoryDateColumn({
          key: 'createdAt',
          label: 'Created',
          formatFn: formatCategoryDateTime,
        }),
        { sortBy, sortOrder, onSort, sortKey: 'createdAt' },
      ),
      withSortableLabel(categoryStatusColumn((row) => <CategoryStatusBadge status={row.status} />), {
        sortBy,
        sortOrder,
        onSort,
        sortKey: 'status',
      }),
      categoryActionsColumn((row) => (
        <ExamCategoryTableActions
          row={row}
          onView={() => onView(row)}
          onEdit={() => onEdit(row)}
          onDelete={() => onDelete(row)}
          onStatusToggle={() => onToggleStatus(row)}
        />
      )),
    ],
    [sortBy, sortOrder, onSort, onView, onEdit, onDelete, onToggleStatus],
  )

  return (
    <CategoryStandardTable
      columns={columns}
      data={teachers}
      loading={loading}
      skeletonRowCount={8}
      itemLabel="faculty"
      resetDeps={resetDeps}
      selection={selection}
      controlledPagination={controlledPagination}
      tableMinWidth={1100}
    />
  )
}
