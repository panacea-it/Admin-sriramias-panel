import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { StatusBadge } from '../academics/AcademicsUi'
import { facultySubjectLabels } from '../../data/facultySubjectLabels'
import FacultySubjectTableActions from './FacultySubjectTableActions'
import SubjectChipPopover from './SubjectChipPopover'
import AdminTooltip from './AdminTooltip'
import { normalizeCategories } from '../../utils/subjectCategoryHelpers'
import {
  CHIP_CELL,
  OVERFLOW_CELL,
  createActionsColumn,
} from '../../utils/tableColumnHelpers'
import { cn } from '../../utils/cn'

function CellWrap({ children, className }) {
  return <div className={cn('w-full min-w-0', className)}>{children}</div>
}

function SubjectNameCell({ name }) {
  const text = name || '—'
  return (
    <CellWrap>
      <span
        className="block truncate text-sm font-bold text-[#111111]"
        title={text !== '—' ? text : undefined}
      >
        {text}
      </span>
    </CellWrap>
  )
}

function TeacherCell({ name }) {
  const text = name || '—'
  return (
    <CellWrap>
      <span
        className="block truncate text-sm font-medium text-[#686868]"
        title={name || undefined}
      >
        {text}
      </span>
    </CellWrap>
  )
}

export default function SubjectTable({
  data,
  onView,
  onEdit,
  onManageContent,
  onDelete,
  onStatusToggle,
  search,
  statusFilter,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectPage,
  allItemIds,
  emptyMessage = `No ${facultySubjectLabels.plural.toLowerCase()} found.`,
  loading = false,
  controlledPagination,
  statusChangingId,
}) {
  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '7%',
      headerClassName: cn(OVERFLOW_CELL, 'whitespace-nowrap'),
      cellClassName: OVERFLOW_CELL,
      headerTruncate: false,
      render: (row) => (
        <CellWrap>
          <AdminTooltip label={`Subject ID: ${row.displayId || row.facultySubjectId || row.id}`}>
            <span className="block truncate font-mono text-xs font-bold tracking-tight text-[#1a3a5c]">
              {row.displayId || row.facultySubjectId || row.id}
            </span>
          </AdminTooltip>
        </CellWrap>
      ),
    },
    {
      key: 'subjectName',
      label: 'Faculty Subject',
      width: '18%',
      headerClassName: OVERFLOW_CELL,
      cellClassName: OVERFLOW_CELL,
      render: (row) => <SubjectNameCell name={row.subjectName} />,
    },
    {
      key: 'teacher',
      label: 'Faculty',
      width: '12%',
      headerClassName: OVERFLOW_CELL,
      cellClassName: OVERFLOW_CELL,
      render: (row) => <TeacherCell name={row.teacher} />,
    },
    {
      key: 'status',
      label: 'Status',
      width: '9%',
      align: 'center',
      headerClassName: cn(OVERFLOW_CELL, 'text-center whitespace-nowrap'),
      cellClassName: cn(OVERFLOW_CELL, 'text-center'),
      headerTruncate: false,
      render: (row) => (
        <div className="flex w-full items-center justify-center px-1">
          <StatusBadge status={row.status} />
        </div>
      ),
    },
    {
      key: 'topics',
      label: 'Topics',
      width: '14%',
      headerClassName: CHIP_CELL,
      cellClassName: CHIP_CELL,
      render: (row) => (
        <CellWrap>
          <SubjectChipPopover
            values={Array.isArray(row.topics) ? row.topics : row.topic ? [row.topic] : []}
            tooltipLabel="All topics"
            maxVisible={2}
          />
        </CellWrap>
      ),
    },
    {
      key: 'categories',
      label: 'Categories',
      width: '18%',
      headerClassName: CHIP_CELL,
      cellClassName: CHIP_CELL,
      render: (row) => (
        <CellWrap>
          <SubjectChipPopover
            values={normalizeCategories(row.categories ?? row.category)}
            tooltipLabel="All categories"
            maxVisible={2}
          />
        </CellWrap>
      ),
    },
    createActionsColumn({
      buttonCount: 4,
      align: 'right',
      render: (row) => (
        <FacultySubjectTableActions
          row={row}
          onView={() => onView?.(row)}
          onEdit={() => onEdit(row)}
          onManageContent={() => onManageContent?.(row)}
          onStatusToggle={() => onStatusToggle?.(row)}
          onDelete={() => onDelete(row)}
          statusLoading={statusChangingId === row.id}
        />
      ),
    }),
  ]

  const selection =
    onToggleSelect && onToggleSelectPage
      ? {
          selectedIds,
          onToggle: onToggleSelect,
          onTogglePage: onToggleSelectPage,
          getRowId: (row) => String(row.id),
          allItemIds,
          columnWidth: 44,
          headerClassName: 'w-11 min-w-[2.75rem] max-w-[2.75rem] px-2 text-center align-middle',
          cellClassName: 'w-11 min-w-[2.75rem] max-w-[2.75rem] px-2 text-center align-middle',
        }
      : undefined

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      itemLabel="subjects"
      resetDeps={[search, statusFilter]}
      rowClassName="hover:bg-[#eef6fc]/70"
      loading={loading}
      controlledPagination={controlledPagination}
      selection={selection}
      density="comfortable"
      skeletonRowCount={8}
      tableMinWidth={1180}
      tableLayoutFixed
      className="min-w-0 rounded-2xl shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80"
      tableClassName="rounded-none border-0 shadow-none"
    />
  )
}
