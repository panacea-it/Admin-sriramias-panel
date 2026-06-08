import CategoryStatusBadge from '../categories/CategoryStatusBadge'
import CategoryTableActions from '../categories/CategoryTableActions'
import { formatCityDateTime } from '../../utils/cityApiHelpers'

export function buildCityTableColumns({ onView, onEdit, onToggle, onDelete }) {
  return [
    {
      key: 'code',
      label: 'City Code',
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-[#246392]">{row.code}</span>
      ),
    },
    {
      key: 'centerName',
      label: 'Center Name',
      render: (row) => (
        <span className="text-sm font-medium text-[#1a3a5c]">{row.centerName || '—'}</span>
      ),
    },
    {
      key: 'placeName',
      label: 'Place Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#55ace7]" />
          <span className="font-medium text-[#1a3a5c]">{row.placeName}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Added On',
      render: (row) => (
        <span className="text-sm text-[#64748b]">{formatCityDateTime(row.createdAt)}</span>
      ),
    },
    {
      key: 'modifiedAt',
      label: 'Modified On',
      render: (row) => (
        <span className="text-sm text-[#64748b]">{formatCityDateTime(row.modifiedAt)}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <CategoryStatusBadge status={row.status === 'Inactive' ? 'In Active' : row.status} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      headerClassName: 'min-w-[11rem] text-right',
      cellClassName: 'min-w-[11rem] text-right',
      render: (row) => (
        <CategoryTableActions
          compact
          status={row.status === 'Inactive' ? 'In Active' : row.status}
          onView={() => onView(row)}
          onEdit={() => onEdit(row)}
          onToggleStatus={() => onToggle(row)}
          onDelete={() => onDelete(row)}
        />
      ),
    },
  ]
}
