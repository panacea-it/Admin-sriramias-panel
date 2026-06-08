import { useMemo } from 'react'
import { RotateCcw, Trash2 } from 'lucide-react'
import { useContentLibrary } from '../../../contexts/ContentLibraryContext'
import { RECYCLE_AUTO_DELETE_DAYS } from '../../../utils/contentLibraryTypes'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'

export default function RecycleBinPage() {
  const { items, restoreItem, deleteItem, loading } = useContentLibrary()

  const deleted = useMemo(() => items.filter((i) => i.status === 'Deleted'), [items])

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'contentType', label: 'Type' },
    {
      key: 'deletedAt',
      label: 'Deleted',
      render: (row) => (row.deletedAt ? new Date(row.deletedAt).toLocaleString() : '—'),
    },
    {
      key: 'expires',
      label: 'Auto-delete',
      render: (row) =>
        row.recycleExpiresAt
          ? new Date(row.recycleExpiresAt).toLocaleDateString()
          : `After ${RECYCLE_AUTO_DELETE_DAYS} days`,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => restoreItem(row.id)}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#55ace7]"
          >
            <RotateCcw className="h-4 w-4" /> Restore
          </button>
          <button
            type="button"
            onClick={() => deleteItem(row.id, true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-[#c96565]"
          >
            <Trash2 className="h-4 w-4" /> Delete forever
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Deleted items are kept for {RECYCLE_AUTO_DELETE_DAYS} days before permanent removal.
      </p>
      {!loading && (
        <PaginatedFigmaTable
          columns={columns}
          data={deleted}
          emptyMessage="Recycle bin is empty."
          itemLabel="items"
        />
      )}
    </div>
  )
}
