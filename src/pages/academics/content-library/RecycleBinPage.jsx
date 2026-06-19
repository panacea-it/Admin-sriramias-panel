import { useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import { useContentLibrary } from '../../../contexts/ContentLibraryContext'
import { RECYCLE_AUTO_DELETE_DAYS } from '../../../utils/contentLibraryTypes'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'

export default function RecycleBinPage() {
  const { items, restoreItem, loading } = useContentLibrary()

  const deactivated = useMemo(() => items.filter((i) => i.status === 'Deleted'), [items])

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'contentType', label: 'Type' },
    {
      key: 'deletedAt',
      label: 'Deactivated',
      render: (row) => (row.deletedAt ? new Date(row.deletedAt).toLocaleString() : '—'),
    },
    {
      key: 'expires',
      label: 'Retention',
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
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Deactivated items are kept for {RECYCLE_AUTO_DELETE_DAYS} days before automatic removal.
      </p>
      {!loading && (
        <PaginatedFigmaTable
          columns={columns}
          data={deactivated}
          emptyMessage="Recycle bin is empty."
          itemLabel="items"
        />
      )}
    </div>
  )
}
