import { useMemo } from 'react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import LeadTableSelect from '../leads/LeadTableSelect'
import PushNotificationMessageCell from './PushNotificationMessageCell'
import PushNotificationTableActions from './PushNotificationTableActions'
import { cn } from '../../utils/cn'

const PUSH_NOTIFICATIONS_TABLE_MIN_WIDTH = 1190

const COLUMN = {
  id: 80,
  sentBy: 120,
  device: 100,
  message: 280,
  center: 130,
  status: 170,
  date: 170,
  actions: 140,
}

const CELL = 'align-middle'

function TextCell({ value, className, mono = false }) {
  const text = value?.toString().trim() ? value : '—'
  return (
    <span
      className={cn(
        'block text-sm leading-snug [overflow-wrap:anywhere]',
        mono && 'font-mono text-xs font-bold tracking-tight text-[#1a3a5c]',
        text === '—' ? 'text-[#9ca0a8]' : 'text-[#111111]',
        className,
      )}
    >
      {text}
    </span>
  )
}

function DateCell({ time, date }) {
  return (
    <div className="leading-snug">
      <span className="block whitespace-nowrap text-sm text-[#111111]">
        {time}
        <span className="text-[#9ca0a8]"> ,</span>
      </span>
      <span className="mt-0.5 block whitespace-nowrap text-xs text-[#686868]">{date}</span>
    </div>
  )
}

const TABLE_CLASS = cn(
  'rounded-none border-0 shadow-none',
  '[&_thead_tr]:!bg-gradient-to-r [&_thead_tr]:!from-[#7eb8e8] [&_thead_tr]:!to-[#55ace7]',
  '[&_thead_tr]:shadow-[0_2px_8px_rgba(85,172,231,0.25)]',
  '[&_thead_th]:align-middle [&_thead_th]:whitespace-nowrap [&_thead_th]:!bg-transparent',
  '[&_thead_th]:text-white [&_thead_th]:text-xs [&_thead_th]:font-semibold sm:[&_thead_th]:text-sm',
  '[&_tbody_td]:align-middle',
)

export default function PushNotificationsTable({
  data,
  emptyMessage,
  resetDeps,
  statusById,
  statusOptions,
  onStatusChange,
  onEdit,
  onDelete,
}) {
  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'ID',
        width: COLUMN.id,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <TextCell value={row.id} mono />,
      },
      {
        key: 'sentBy',
        label: 'Sent By',
        width: COLUMN.sentBy,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <TextCell value={row.sentBy} className="font-semibold" />,
      },
      {
        key: 'device',
        label: 'Device',
        width: COLUMN.device,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <TextCell value={row.device} />,
      },
      {
        key: 'message',
        label: 'Message',
        width: COLUMN.message,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <PushNotificationMessageCell message={row.message} />,
      },
      {
        key: 'center',
        label: 'Center',
        width: COLUMN.center,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <span className="block text-sm font-medium leading-snug text-[#111111]">{row.center}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        width: COLUMN.status,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => (
          <LeadTableSelect
            value={statusById[row.id] || ''}
            onChange={(value) => onStatusChange(row.id, value)}
            options={statusOptions}
            ariaLabel={`Status for notification ${row.id}`}
            placeholder="Select Status"
            variant="status"
          />
        ),
      },
      {
        key: 'date',
        label: 'Date',
        width: COLUMN.date,
        headerTruncate: false,
        headerClassName: CELL,
        cellClassName: CELL,
        render: (row) => <DateCell time={row.sentTime} date={row.sentDate} />,
      },
      {
        key: 'actions',
        label: 'Action',
        width: COLUMN.actions,
        align: 'center',
        headerTruncate: false,
        headerClassName: cn(CELL, 'text-center'),
        cellClassName: cn(CELL, 'text-center'),
        render: (row) => (
          <PushNotificationTableActions
            row={row}
            onEdit={() => onEdit(row)}
            onDelete={() => onDelete(row.id)}
          />
        ),
      },
    ],
    [statusById, statusOptions, onStatusChange, onEdit, onDelete],
  )

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={data}
      emptyMessage={emptyMessage}
      itemLabel="notifications"
      resetDeps={resetDeps}
      rowClassName="hover:bg-[#eef6fc]/70"
      zebraStriping
      density="comfortable"
      tableMinWidth={PUSH_NOTIFICATIONS_TABLE_MIN_WIDTH}
      tableLayoutFixed
      gradientActivePage
      className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
      tableClassName={TABLE_CLASS}
      paginationClassName="border-t border-[#E5E7EB] bg-white"
    />
  )
}
