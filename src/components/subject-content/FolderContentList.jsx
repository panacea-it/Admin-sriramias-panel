import { Eye, Pencil, Trash2, Upload, Copy, Play, Download, FileText, BarChart3 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { contentTypeFromCategoryType, CATEGORY_TYPES } from '../../utils/facultySubjectHierarchy'

function ActionLink({ label, onClick, className, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium transition hover:opacity-80',
        className,
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}

function TableShell({ columns, rows, emptyMessage }) {
  if (!rows.length) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyMessage}</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="bg-[#1a3a5c] text-left text-xs font-semibold uppercase tracking-wide text-white">
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-2.5 font-semibold">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              className={cn(
                'border-b border-slate-100 transition',
                idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]',
                row.active && 'ring-1 ring-inset ring-[#55ace7]/40',
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2.5 text-slate-700">
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LiveActions({ row, onView, onEdit, onDelete, onPublish, onDuplicate }) {
  return (
    <div className="flex flex-wrap gap-2">
      <ActionLink label="View" onClick={() => onView(row)} className="text-[#246392]" icon={Eye} />
      <ActionLink label="Edit" onClick={() => onEdit(row)} className="text-[#686868]" icon={Pencil} />
      <ActionLink label="Delete" onClick={() => onDelete(row)} className="text-[#c96565]" icon={Trash2} />
      <ActionLink label="Publish" onClick={() => onPublish(row)} className="text-emerald-700" icon={Upload} />
      <ActionLink label="Duplicate" onClick={() => onDuplicate(row)} className="text-slate-600" icon={Copy} />
    </div>
  )
}

export default function FolderContentList({
  categoryType,
  rows = [],
  activeItemId,
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
}) {
  const contentType = contentTypeFromCategoryType(categoryType)

  if (contentType === 'live') {
    const columns = [
      {
        key: 'title',
        label: 'Class Title',
        render: (r) => <span className="font-semibold text-[#111]">{r.classTitle}</span>,
      },
      { key: 'date', label: 'Date', render: (r) => r.date },
      { key: 'time', label: 'Time', render: (r) => r.time },
      {
        key: 'faculty',
        label: 'Faculty',
        render: (r) => r.faculty,
      },
      { key: 'batch', label: 'Batch', render: (r) => r.batch },
      { key: 'center', label: 'Center', render: (r) => r.center },
      { key: 'classroom', label: 'Classroom', render: (r) => r.classroom },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <span
            className={cn(
              'inline-flex rounded-md px-2 py-0.5 text-xs font-semibold text-white',
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
        render: (r) => (
          <LiveActions
            row={r}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onPublish={onPublish}
            onDuplicate={onDuplicate}
          />
        ),
      },
    ]
    return (
      <TableShell
        columns={columns}
        rows={rows.map((r) => ({ ...r, active: r.id === activeItemId }))}
        emptyMessage="No classes yet. Click + Add Class to create one."
      />
    )
  }

  if (contentType === 'recording') {
    const columns = [
      {
        key: 'title',
        label: 'Video Title',
        render: (r) => <span className="font-semibold">{r.videoTitle}</span>,
      },
      { key: 'duration', label: 'Duration', render: (r) => r.duration },
      {
        key: 'status',
        label: 'Status',
        render: (r) => (
          <span className="font-medium text-[#246392]">{r.visibility || r.status}</span>
        ),
      },
      { key: 'views', label: 'Views', render: (r) => r.views },
      {
        key: 'actions',
        label: 'Actions',
        render: (r) => (
          <div className="flex flex-wrap gap-2">
            <ActionLink label="Play" onClick={() => onPlay(r)} className="text-[#246392]" icon={Play} />
            <ActionLink label="Edit" onClick={() => onEdit(r)} className="text-[#686868]" icon={Pencil} />
            <ActionLink label="Delete" onClick={() => onDelete(r)} className="text-[#c96565]" icon={Trash2} />
            <ActionLink label="Publish" onClick={() => onPublish(r)} className="text-emerald-700" icon={Upload} />
          </div>
        ),
      },
    ]
    return (
      <TableShell
        columns={columns}
        rows={rows.map((r) => ({ ...r, active: r.id === activeItemId }))}
        emptyMessage="No recordings yet. Click + Add Recording to upload."
      />
    )
  }

  if (contentType === 'test') {
    const columns = [
      {
        key: 'name',
        label: 'Test Name',
        render: (r) => <span className="font-semibold">{r.testName}</span>,
      },
      { key: 'questions', label: 'Questions', render: (r) => r.questions },
      { key: 'duration', label: 'Duration', render: (r) => r.duration },
      { key: 'status', label: 'Status', render: (r) => r.status },
      {
        key: 'actions',
        label: 'Actions',
        render: (r) => (
          <div className="flex flex-wrap gap-2">
            <ActionLink label="Start Test" onClick={() => onStartTest(r)} className="text-[#246392]" icon={Play} />
            <ActionLink label="Edit" onClick={() => onEdit(r)} className="text-[#686868]" icon={Pencil} />
            <ActionLink label="Delete" onClick={() => onDelete(r)} className="text-[#c96565]" icon={Trash2} />
            <ActionLink label="Publish" onClick={() => onPublish(r)} className="text-emerald-700" icon={Upload} />
            <ActionLink label="Preview" onClick={() => onView(r)} className="text-slate-600" icon={Eye} />
            <ActionLink label="Results" onClick={() => onView(r)} className="text-slate-600" icon={BarChart3} />
          </div>
        ),
      },
    ]
    return (
      <TableShell
        columns={columns}
        rows={rows.map((r) => ({ ...r, active: r.id === activeItemId }))}
        emptyMessage="No tests yet. Click + Add Test Series to configure."
      />
    )
  }

  if (categoryType === CATEGORY_TYPES.MAINS_ANSWER_WRITING) {
    const columns = [
      {
        key: 'title',
        label: 'Assignment Title',
        render: (r) => <span className="font-semibold">{r.assignmentTitle}</span>,
      },
      { key: 'due', label: 'Due Date', render: (r) => r.dueDate },
      { key: 'status', label: 'Status', render: (r) => r.status },
      {
        key: 'actions',
        label: 'Actions',
        render: (r) => (
          <div className="flex flex-wrap gap-2">
            <ActionLink label="View" onClick={() => onView(r)} className="text-[#246392]" icon={Eye} />
            <ActionLink label="Edit" onClick={() => onEdit(r)} className="text-[#686868]" icon={Pencil} />
            <ActionLink label="Delete" onClick={() => onDelete(r)} className="text-[#c96565]" icon={Trash2} />
            <ActionLink label="Publish" onClick={() => onPublish(r)} className="text-emerald-700" icon={Upload} />
            <ActionLink label="Evaluate" onClick={() => onEvaluate(r)} className="text-slate-600" icon={BarChart3} />
          </div>
        ),
      },
    ]
    return (
      <TableShell
        columns={columns}
        rows={rows.map((r) => ({ ...r, active: r.id === activeItemId }))}
        emptyMessage="No assignments yet. Click + Add Assignment."
      />
    )
  }

  if (contentType === 'pdf') {
    const columns = [
      {
        key: 'name',
        label: 'PDF Name',
        render: (r) => (
          <span className="inline-flex items-center gap-2 font-semibold">
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
        render: (r) => (
          <div className="flex flex-wrap gap-2">
            <ActionLink label="Preview" onClick={() => onPreviewPdf(r)} className="text-[#246392]" icon={Eye} />
            <ActionLink label="Download" onClick={() => onDownload(r)} className="text-slate-600" icon={Download} />
            <ActionLink label="Edit" onClick={() => onEdit(r)} className="text-[#686868]" icon={Pencil} />
            <ActionLink label="Delete" onClick={() => onDelete(r)} className="text-[#c96565]" icon={Trash2} />
          </div>
        ),
      },
    ]
    return (
      <TableShell
        columns={columns}
        rows={rows.map((r) => ({ ...r, active: r.id === activeItemId }))}
        emptyMessage="No PDFs yet. Click + Add PDF to upload."
      />
    )
  }

  return null
}
