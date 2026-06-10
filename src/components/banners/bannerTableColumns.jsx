import BannerThumbnail from './BannerThumbnail'
import BannerStatusBadge from './BannerStatusBadge'
import BannerTableActions from './BannerTableActions'

export function buildBannerTableColumns({
  onEdit,
  onDelete,
  onPreview,
  onToggleStatus,
  statusUpdatingIds,
}) {
  return [
    {
      key: 'id',
      label: 'ID',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10 align-middle font-semibold whitespace-nowrap',
    },
    {
      key: 'course',
      label: 'Course',
      cellClassName: 'align-middle max-w-[280px] sm:max-w-xs',
      render: (row) => <span className="font-medium leading-snug">{row.course}</span>,
    },
    {
      key: 'category',
      label: 'BATCH Category',
      cellClassName: 'align-middle whitespace-nowrap',
    },
    {
      key: 'batch',
      label: 'BATCH',
      cellClassName: 'align-middle whitespace-nowrap',
      render: (row) => <span>{row.batch || '—'}</span>,
    },
    {
      key: 'banner',
      label: 'Banner',
      cellClassName: 'align-middle',
      render: (row) => (
        <BannerThumbnail banner={row} onClick={() => onPreview?.(row)} />
      ),
    },
    {
      key: 'center',
      label: 'Center',
      cellClassName: 'align-middle whitespace-nowrap',
    },
    {
      key: 'status',
      label: 'Status',
      cellClassName: 'align-middle',
      render: (row) => (
        <BannerStatusBadge
          status={row.status}
          loading={statusUpdatingIds?.has(row.id)}
          disabled={statusUpdatingIds?.has(row.id)}
          onClick={() => onToggleStatus?.(row)}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'pr-6 sm:pr-10',
      cellClassName: 'align-middle pr-6 sm:pr-10 whitespace-nowrap',
      render: (row) => (
        <BannerTableActions
          onEdit={() => onEdit?.(row)}
          onDelete={() => onDelete?.(row)}
          onPreview={() => onPreview?.(row)}
        />
      ),
    },
  ]
}
