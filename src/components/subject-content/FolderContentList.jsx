import { useMemo } from 'react'
import {
  Eye,
  Pencil,
  Trash2,
  Upload,
  Copy,
  Play,
  Download,
  FileText,
  BarChart3,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { contentTypeFromCategoryType, CATEGORY_TYPES } from '../../utils/facultySubjectHierarchy'
import ContentEmptyState from './ContentEmptyState'
import ContentBulkToolbar from './ContentBulkToolbar'

function IconActionButton({ icon: Icon, label, onClick, variant = 'default', className }) {
  const variants = {
    default: 'text-slate-600 hover:bg-slate-100 hover:text-[#246392]',
    view: 'text-[#246392] hover:bg-[#eef2fc] hover:text-[#1a3a5c]',
    edit: 'text-[#686868] hover:bg-slate-100 hover:text-[#1a3a5c]',
    delete: 'text-[#c96565] hover:bg-red-50 hover:text-[#b91c1c]',
    success: 'text-emerald-700 hover:bg-emerald-50',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150',
        'hover:scale-105 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/40 focus-visible:ring-offset-1',
        variants[variant] || variants.default,
        className,
      )}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
    </button>
  )
}

function RowActions({ children }) {
  return (
    <div className="flex items-center justify-end gap-0.5">{children}</div>
  )
}

function CheckboxCell({ checked, onChange, label }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="h-4 w-4 cursor-pointer rounded border-[#55ace7]/40 text-[#246392] transition focus:ring-2 focus:ring-[#55ace7]/40 focus:ring-offset-1"
    />
  )
}

function PremiumTable({
  columns,
  rows,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
  someSelected,
  onBulkDelete,
  onBulkDisable,
  onBulkEnable,
  showEnableDisable = true,
  emptyState,
  activeItemId,
  showSelection = false,
}) {
  const hasRows = rows.length > 0
  const selectedCount = selectedIds.length

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.06)]">
      {showSelection && (
        <ContentBulkToolbar
          selectedCount={selectedCount}
          onDelete={onBulkDelete}
          onDisable={onBulkDisable}
          onEnable={onBulkEnable}
          showEnableDisable={showEnableDisable}
        />
      )}

      {!hasRows ? (
        emptyState
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-r from-[#55ace7] to-[#246392] text-left text-xs font-semibold uppercase tracking-wide text-white shadow-[0_2px_8px_rgba(15,23,42,0.12)]">
                {showSelection && (
                  <th className="w-12 px-4 py-3.5 first:pl-5 sm:first:pl-6">
                    <CheckboxCell
                      checked={allSelected}
                      onChange={onToggleSelectAll}
                      label="Select all rows"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap px-4 py-3.5 font-semibold',
                      col.headerClassName,
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isSelected = selectedIds.includes(String(row.id))
                const isActive = row.id === activeItemId
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-slate-100/90 text-sm transition-colors duration-150',
                      idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50',
                      'hover:bg-[#f0f7ff]',
                      showSelection && isSelected && 'bg-[#eef2fc]/80',
                      isActive && 'ring-1 ring-inset ring-[#55ace7]/30',
                    )}
                  >
                    {showSelection && (
                      <td className="w-12 px-4 py-3.5 first:pl-5 sm:first:pl-6">
                        <CheckboxCell
                          checked={isSelected}
                          onChange={() => onToggleSelect(String(row.id))}
                          label={`Select row ${row.id}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3.5 align-middle text-slate-700',
                          col.cellClassName,
                        )}
                      >
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function FolderContentList({
  categoryType,
  rows = [],
  activeItemId,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onPublish,
  onDuplicate,
  onPlay,
  onDownload,
  onPreviewPdf,
  onStartTest,
  onEvaluate,
  onAdd,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onBulkDelete,
  onBulkDisable,
  onBulkEnable,
}) {
  const contentType = contentTypeFromCategoryType(categoryType)
  const rowIds = useMemo(() => rows.map((r) => String(r.id)), [rows])
  const showSelection = Boolean(onToggleSelect && onToggleSelectAll)
  const allSelected = rowIds.length > 0 && rowIds.every((id) => selectedIds.includes(id))
  const someSelected = rowIds.some((id) => selectedIds.includes(id))

  const tableRows = rows.map((r) => ({ ...r, active: r.id === activeItemId }))

  const emptyState = (
    <ContentEmptyState categoryType={categoryType} onAdd={onAdd} className="border-0 shadow-none" />
  )

  if (loading) {
    return null
  }

  const sharedProps = {
    rows: tableRows,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    allSelected,
    someSelected,
    onBulkDelete,
    onBulkDisable,
    onBulkEnable,
    showEnableDisable: true,
    emptyState,
    activeItemId,
    showSelection,
  }

  if (contentType === 'live') {
    const columns = [
      {
        key: 'title',
        label: 'Class Title',
        render: (r) => <span className="font-semibold text-[#111]">{r.classTitle}</span>,
      },
      { key: 'date', label: 'Date', render: (r) => <span className="text-slate-600">{r.date}</span> },
      { key: 'time', label: 'Time', render: (r) => <span className="text-slate-600">{r.time}</span> },
      { key: 'faculty', label: 'Faculty', render: (r) => r.faculty },
      { key: 'batch', label: 'Batch', render: (r) => r.batch },
      { key: 'center', label: 'Center', render: (r) => r.center },
      { key: 'classroom', label: 'Classroom', render: (r) => r.classroom },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <span
            className={cn(
              'inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold text-white shadow-sm',
              r.liveStatus === 'Active' ? 'bg-[#69df66]' : 'bg-[#efb36d]',
            )}
          >
            {r.liveStatus}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        headerClassName: 'text-right pr-5 sm:pr-6',
        cellClassName: 'pr-5 sm:pr-6',
        render: (r) => (
          <RowActions>
            <IconActionButton icon={Eye} label="View" onClick={() => onView(r)} variant="view" />
            <IconActionButton icon={Pencil} label="Edit" onClick={() => onEdit(r)} variant="edit" />
            <IconActionButton icon={Trash2} label="Delete" onClick={() => onDelete(r)} variant="delete" />
            <IconActionButton icon={Upload} label="Publish" onClick={() => onPublish(r)} variant="success" />
            <IconActionButton icon={Copy} label="Duplicate" onClick={() => onDuplicate(r)} />
          </RowActions>
        ),
      },
    ]
    return <PremiumTable columns={columns} {...sharedProps} />
  }

  if (contentType === 'recording') {
    const columns = [
      {
        key: 'title',
        label: 'Video Title',
        render: (r) => <span className="font-semibold text-[#111]">{r.videoTitle}</span>,
      },
      { key: 'duration', label: 'Duration', render: (r) => r.duration },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <span className="inline-flex rounded-lg bg-[#eef2fc] px-2.5 py-1 text-xs font-semibold text-[#246392]">
            {r.visibility || r.status}
          </span>
        ),
      },
      { key: 'views', label: 'Views', render: (r) => r.views },
      {
        key: 'actions',
        label: 'Actions',
        headerClassName: 'text-right pr-5 sm:pr-6',
        cellClassName: 'pr-5 sm:pr-6',
        render: (r) => (
          <RowActions>
            <IconActionButton icon={Play} label="Play" onClick={() => onPlay(r)} variant="view" />
            <IconActionButton icon={Eye} label="View" onClick={() => onView(r)} variant="view" />
            <IconActionButton icon={Pencil} label="Edit" onClick={() => onEdit(r)} variant="edit" />
            <IconActionButton icon={Trash2} label="Delete" onClick={() => onDelete(r)} variant="delete" />
            <IconActionButton icon={Upload} label="Publish" onClick={() => onPublish(r)} variant="success" />
          </RowActions>
        ),
      },
    ]
    return <PremiumTable columns={columns} {...sharedProps} />
  }

  if (contentType === 'test') {
    const columns = [
      {
        key: 'name',
        label: 'Test Name',
        render: (r) => <span className="font-semibold text-[#111]">{r.testName}</span>,
      },
      { key: 'questions', label: 'Questions', render: (r) => r.questions },
      { key: 'duration', label: 'Duration', render: (r) => r.duration },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {r.status}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        headerClassName: 'text-right pr-5 sm:pr-6',
        cellClassName: 'pr-5 sm:pr-6',
        render: (r) => (
          <RowActions>
            <IconActionButton icon={Eye} label="View" onClick={() => onView(r)} variant="view" />
            <IconActionButton icon={Pencil} label="Edit" onClick={() => onEdit(r)} variant="edit" />
            <IconActionButton icon={Trash2} label="Delete" onClick={() => onDelete(r)} variant="delete" />
            <IconActionButton icon={Play} label="Start Test" onClick={() => onStartTest(r)} />
            <IconActionButton icon={Upload} label="Publish" onClick={() => onPublish(r)} variant="success" />
            <IconActionButton icon={BarChart3} label="Results" onClick={() => onView(r)} />
          </RowActions>
        ),
      },
    ]
    return <PremiumTable columns={columns} {...sharedProps} />
  }

  if (categoryType === CATEGORY_TYPES.MAINS_ANSWER_WRITING) {
    const columns = [
      {
        key: 'title',
        label: 'Assignment Title',
        render: (r) => <span className="font-semibold text-[#111]">{r.assignmentTitle}</span>,
      },
      { key: 'due', label: 'Due Date', render: (r) => r.dueDate },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {r.status}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        headerClassName: 'text-right pr-5 sm:pr-6',
        cellClassName: 'pr-5 sm:pr-6',
        render: (r) => (
          <RowActions>
            <IconActionButton icon={Eye} label="View" onClick={() => onView(r)} variant="view" />
            <IconActionButton icon={Pencil} label="Edit" onClick={() => onEdit(r)} variant="edit" />
            <IconActionButton icon={Trash2} label="Delete" onClick={() => onDelete(r)} variant="delete" />
            <IconActionButton icon={Upload} label="Publish" onClick={() => onPublish(r)} variant="success" />
            <IconActionButton icon={BarChart3} label="Evaluate" onClick={() => onEvaluate(r)} />
          </RowActions>
        ),
      },
    ]
    return <PremiumTable columns={columns} {...sharedProps} />
  }

  if (contentType === 'pdf') {
    const columns = [
      {
        key: 'name',
        label: 'PDF Name',
        render: (r) => (
          <span className="inline-flex items-center gap-2 font-semibold text-[#111]">
            <FileText className="h-4 w-4 text-red-500" />
            {r.pdfName}
          </span>
        ),
      },
      { key: 'size', label: 'Size', render: (r) => r.fileSize },
      { key: 'uploaded', label: 'Uploaded', render: (r) => r.uploaded },
      {
        key: 'actions',
        label: 'Actions',
        headerClassName: 'text-right pr-5 sm:pr-6',
        cellClassName: 'pr-5 sm:pr-6',
        render: (r) => (
          <RowActions>
            <IconActionButton icon={Eye} label="View" onClick={() => onPreviewPdf(r)} variant="view" />
            <IconActionButton icon={Pencil} label="Edit" onClick={() => onEdit(r)} variant="edit" />
            <IconActionButton icon={Trash2} label="Delete" onClick={() => onDelete(r)} variant="delete" />
            <IconActionButton icon={Download} label="Download" onClick={() => onDownload(r)} />
          </RowActions>
        ),
      },
    ]
    return <PremiumTable columns={columns} {...sharedProps} showEnableDisable={false} />
  }

  return null
}
