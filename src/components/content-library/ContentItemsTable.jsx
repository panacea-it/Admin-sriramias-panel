import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Archive,
  Copy,
  Eye,
  FolderInput,
  Link2,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import TableActionMenu from '../common/TableActionMenu'
import { StatusBadge } from '../academics/AcademicsUi'
import { CONTENT_LIBRARY_BASE } from '../../constants/contentLibraryNav'
import { formatBytes } from '../../utils/contentLibraryTypes'
import ContentPreviewModal from './ContentPreviewModal'
import ContentShareModal from './ContentShareModal'
import { useState } from 'react'

function ThumbnailCell({ item }) {
  const src = item.thumbnailUrl
  return (
    <div className="flex h-11 w-16 items-center justify-center overflow-hidden rounded-lg bg-[#cbeeff]">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="text-[10px] font-bold text-[#246392]">{item.contentType?.slice(0, 3)}</span>
      )}
    </div>
  )
}

export default function ContentItemsTable({
  items,
  subjects,
  topics,
  categories,
  batches,
  courses,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onPublishToggle,
  emptyMessage,
  resetDeps = [],
}) {
  const navigate = useNavigate()
  const [previewItem, setPreviewItem] = useState(null)
  const [shareItem, setShareItem] = useState(null)

  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s.name])), [subjects])
  const topicMap = useMemo(() => Object.fromEntries(topics.map((t) => [t.id, t.name])), [topics])
  const batchMap = useMemo(
    () => Object.fromEntries((batches || []).map((b) => [b.id, b.name])),
    [batches],
  )
  const courseMap = useMemo(
    () => Object.fromEntries((courses || []).map((c) => [c.id, c.name])),
    [courses],
  )

  const columns = [
    {
      key: 'thumb',
      label: '',
      headerClassName: 'w-20 pl-6',
      cellClassName: 'pl-6',
      render: (row) => <ThumbnailCell item={row} />,
    },
    {
      key: 'title',
      label: 'Content Title',
      render: (row) => (
        <div className="max-w-[220px]">
          <p className="truncate font-semibold text-[#1a3a5c]">{row.title}</p>
          <p className="truncate text-xs text-slate-500">{row.contentType}</p>
        </div>
      ),
    },
    { key: 'contentType', label: 'Type' },
    {
      key: 'subject',
      label: 'Subject',
      render: (row) =>
        (row.subjectIds || []).map((id) => subjectMap[id]).filter(Boolean).join(', ') || '—',
    },
    {
      key: 'topic',
      label: 'Topic',
      render: (row) =>
        (row.topicIds || []).map((id) => topicMap[id]).filter(Boolean).join(', ') || '—',
    },
    {
      key: 'course',
      label: 'Course',
      render: (row) =>
        (row.courseIds || []).map((id) => courseMap[id]).filter(Boolean).join(', ') || '—',
    },
    {
      key: 'batch',
      label: 'Batch',
      render: (row) =>
        (row.batchIds || []).map((id) => batchMap[id]).filter(Boolean).join(', ') || '—',
    },
    { key: 'uploadedBy', label: 'Uploaded By' },
    {
      key: 'uploadedAt',
      label: 'Upload Date',
      render: (row) =>
        row.uploadedAt ? new Date(row.uploadedAt).toLocaleDateString() : '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'views', label: 'Views' },
    { key: 'downloads', label: 'Downloads' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <TableActionMenu
          items={[
            { label: 'View', icon: Eye, onClick: () => setPreviewItem(row) },
            {
              label: 'Edit',
              icon: Pencil,
              onClick: () =>
                onEdit
                  ? onEdit(row)
                  : navigate(`${CONTENT_LIBRARY_BASE}/upload`, { state: { item: row } }),
            },
            { label: 'Duplicate', icon: Copy, onClick: () => onDuplicate?.(row) },
            {
              label: row.status === 'Published' ? 'Unpublish' : 'Publish',
              icon: Send,
              onClick: () => onPublishToggle?.(row),
            },
            { label: 'Share', icon: Link2, onClick: () => setShareItem(row) },
            { label: 'Archive', icon: Archive, onClick: () => onArchive?.(row) },
            { label: 'Delete', icon: Trash2, danger: true, onClick: () => onDelete?.(row) },
            {
              label: 'Move',
              icon: FolderInput,
              onClick: () => navigate(`${CONTENT_LIBRARY_BASE}/categories`),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PaginatedFigmaTable
        columns={columns}
        data={items}
        emptyMessage={emptyMessage || 'No content found.'}
        itemLabel="items"
        resetDeps={resetDeps}
        rowClassName="hover:bg-slate-50/90"
      />
      <ContentPreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      <ContentShareModal item={shareItem} onClose={() => setShareItem(null)} />
    </>
  )
}

export function ContentEmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
      <p className="text-lg font-semibold text-[#1a3a5c]">{title}</p>
      <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
