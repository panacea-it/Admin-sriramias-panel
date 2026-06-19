import CategoryStatusBadge from '../categories/CategoryStatusBadge'
import CourseTableActions from '../categories/CourseTableActions'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { formatCityDateTime, getCityDisplayCode } from '../../utils/cityApiHelpers'
import { cn } from '../../utils/cn'

export function buildCityTableColumns({ onView, onEdit, onToggle, onDelete }) {
  return [
    {
      key: 'code',
      label: 'City Code',
      headerClassName: 'min-w-[7rem]',
      cellClassName: 'whitespace-nowrap',
      render: (row) => {
        const code = getCityDisplayCode(row)
        return (
          <span className="font-mono text-sm font-semibold text-[#246392]">{code}</span>
        )
      },
    },
    {
      key: 'centerName',
      label: 'Center Name',
      cellClassName: 'max-w-[180px]',
      render: (row) => (
        <span className="text-sm font-medium text-[#111]">{row.centerName || '—'}</span>
      ),
    },
    {
      key: 'placeName',
      label: 'Place Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#55ace7]" />
          <span className="font-medium text-[#111]">{row.placeName}</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Added On',
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-[#444]">
          {formatCityDateTime(row.createdAt)}
        </span>
      ),
    },
    {
      key: 'modifiedAt',
      label: 'Modified On',
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-[#444]">
          {formatCityDateTime(row.modifiedAt)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      headerClassName: 'min-w-[6rem]',
      render: (row) => (
        <CategoryStatusBadge status={row.status === 'Deactivated' ? 'In Active' : row.status} />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      headerClassName: 'min-w-[200px] whitespace-nowrap pr-4 sm:pr-6',
      cellClassName: 'min-w-[200px] whitespace-nowrap align-middle pr-4 sm:pr-6',
      render: (row) => (
        <CourseTableActions
          row={{ ...row, name: row.placeName }}
          status={row.status === 'Deactivated' ? 'In Active' : row.status}
          onView={() => onView(row)}
          onEdit={() => onEdit(row)}
          onToggleStatus={() => onToggle(row)}
          onDelete={() => onDelete(row)}
        />
      ),
    },
  ]
}

export default function CityTable({
  cities,
  loading,
  controlledPagination,
  columns,
  resetDeps = [],
  selection,
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#f0f2f5]/60 p-2 sm:p-3">
      <PaginatedFigmaTable
        columns={columns}
        data={cities}
        loading={loading}
        skeletonRowCount={8}
        itemLabel="cities"
        resetDeps={resetDeps}
        selection={selection}
        density="comfortable"
        controlledPagination={controlledPagination}
        rowClassName={cn(
          'bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-shadow duration-200',
          'hover:bg-white hover:shadow-[0_4px_16px_rgba(15,23,42,0.1)]',
        )}
        tableClassName={cn(
          'rounded-xl bg-transparent shadow-none min-w-[720px]',
          '[&_table]:border-separate [&_table]:border-spacing-y-2',
          '[&_thead_tr]:bg-gradient-to-r [&_thead_tr]:from-[#7eb8e8] [&_thead_tr]:to-[#55ace7]',
          '[&_thead_tr]:shadow-[0_2px_8px_rgba(85,172,231,0.25)]',
          '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap',
          '[&_tbody_tr]:rounded-xl [&_tbody_tr]:overflow-hidden',
          '[&_tbody_td]:align-middle',
          '[&_tbody_td:first-child]:rounded-l-xl [&_tbody_td:last-child]:rounded-r-xl',
        )}
        className="rounded-xl bg-transparent shadow-none"
      />
    </div>
  )
}
