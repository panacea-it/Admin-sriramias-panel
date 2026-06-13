import { useCallback, useMemo, useState } from 'react'
import { BellRing } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { BannerButton } from '../../components/academics/AcademicsUi'
import NotificationMessageModal from '../../components/push-notifications/NotificationMessageModal'
import PushNotificationFilterToolbar from '../../components/push-notifications/PushNotificationFilterToolbar'
import PushNotificationMessageCell from '../../components/push-notifications/PushNotificationMessageCell'
import PushNotificationTableActions from '../../components/push-notifications/PushNotificationTableActions'
import SendPushNotificationModal from '../../components/push-notifications/SendPushNotificationModal'
import CrmDeleteConfirmDialog from '../../components/crm/CrmDeleteConfirmDialog'
import { INITIAL_PUSH_NOTIFICATIONS, formatNotificationStatusLabel, pushNotificationMatchesSelectedDate } from '../../data/pushNotificationsData'
import { getLeadStatusChipClass } from '../../components/enquiries/EnquiryTableSelect'
import { cn } from '../../utils/cn'

function DateCell({ time, date }) {
  return (
    <div className="flex flex-col gap-0.5 leading-snug">
      <span>
        {time}
        <span className="text-[#9ca0a8]"> ,</span>
      </span>
      <span className="text-xs text-[#686868]">{date}</span>
    </div>
  )
}

function StatusChip({ status }) {
  const label = formatNotificationStatusLabel(status || 'NEW')
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        getLeadStatusChipClass(status || 'NEW'),
      )}
    >
      {label}
    </span>
  )
}

function CounselorCell({ name }) {
  const value = String(name || '').trim()
  return (
    <span className={cn(!value && 'text-[#9ca0a8]')}>
      {value || '—'}
    </span>
  )
}

export default function PushNotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_PUSH_NOTIFICATIONS)
  const [search, setSearch] = useState('')
  const [centerFilter, setCenterFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [messageModal, setMessageModal] = useState(null)
  const [deleteNotificationId, setDeleteNotificationId] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return notifications.filter((row) => {
      const matchSearch =
        !q ||
        String(row.id).includes(q) ||
        row.sentBy.toLowerCase().includes(q) ||
        row.message.toLowerCase().includes(q) ||
        row.device.toLowerCase().includes(q) ||
        row.center.toLowerCase().includes(q) ||
        (row.assignedCounselorName || '').toLowerCase().includes(q) ||
        formatNotificationStatusLabel(row.leadStatus).toLowerCase().includes(q)
      const matchCenter = centerFilter === 'all' || row.center === centerFilter
      const matchDate = pushNotificationMatchesSelectedDate(row, dateFilter)
      return matchSearch && matchCenter && matchDate
    })
  }, [notifications, search, centerFilter, dateFilter])

  const openSendModal = useCallback((row = null) => {
    setEditingRow(row)
    setSendModalOpen(true)
  }, [])

  const closeSendModal = useCallback(() => {
    setSendModalOpen(false)
    setEditingRow(null)
  }, [])

  const handleSaveNotification = useCallback((notification, mode) => {
    if (mode === 'create') {
      setNotifications((prev) => [notification, ...prev])
      toast.success('Notification sent successfully')
    } else {
      setNotifications((prev) =>
        prev.map((row) => (row.id === notification.id ? notification : row)),
      )
      toast.success('Notification updated successfully')
    }
  }, [])

  const handleDelete = useCallback((id) => {
    setNotifications((prev) => prev.filter((row) => row.id !== id))
    toast.success('Notification deleted')
  }, [])

  const handleConfirmDeleteNotification = useCallback(() => {
    if (deleteNotificationId == null) return
    handleDelete(deleteNotificationId)
    setDeleteNotificationId(null)
  }, [deleteNotificationId, handleDelete])

  const openMessageModal = useCallback((message) => {
    setMessageModal(message)
  }, [])

  const closeMessageModal = useCallback(() => {
    setMessageModal(null)
  }, [])

  const columns = useMemo(
    () => [
      {
        key: 'id',
        label: 'ID',
        align: 'center',
        headerClassName: 'min-w-[80px]',
        cellClassName: 'align-middle text-left font-semibold whitespace-nowrap',
      },
      {
        key: 'sentBy',
        label: 'Sent By',
        align: 'center',
        headerClassName: 'min-w-[110px]',
        cellClassName: 'align-middle text-left whitespace-nowrap',
      },
      {
        key: 'device',
        label: 'Device',
        align: 'center',
        headerClassName: 'min-w-[90px]',
        cellClassName: 'align-middle text-left whitespace-nowrap',
      },
      {
        key: 'message',
        label: 'Message',
        align: 'center',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'align-middle text-left max-w-[280px]',
        render: (row) => (
          <PushNotificationMessageCell message={row.message} onOpen={openMessageModal} />
        ),
      },
      {
        key: 'center',
        label: 'Center',
        align: 'center',
        headerClassName: 'min-w-[110px]',
        cellClassName: 'align-middle text-left whitespace-nowrap',
      },
      {
        key: 'assignedCounselor',
        label: 'Assigned Counselor',
        align: 'center',
        headerClassName: 'min-w-[150px]',
        cellClassName: 'align-middle text-left whitespace-nowrap',
        render: (row) => <CounselorCell name={row.assignedCounselorName} />,
      },
      {
        key: 'leadStatus',
        label: 'Status',
        align: 'center',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'align-middle text-left',
        render: (row) => <StatusChip status={row.leadStatus} />,
      },
      {
        key: 'date',
        label: 'Date',
        align: 'center',
        headerClassName: 'min-w-[120px]',
        cellClassName: 'align-middle text-left whitespace-nowrap',
        render: (row) => <DateCell time={row.sentTime} date={row.sentDate} />,
      },
      {
        key: 'action',
        label: 'Action',
        align: 'center',
        headerClassName: 'min-w-[160px]',
        cellClassName: 'align-middle text-center',
        render: (row) => (
          <PushNotificationTableActions
            row={row}
            onEdit={() => openSendModal(row)}
            onDelete={() => setDeleteNotificationId(row.id)}
          />
        ),
      },
    ],
    [openMessageModal, openSendModal],
  )

  const emptyMessage = dateFilter
    ? 'No push notifications found for the selected date.'
    : 'No notifications match your filters.'

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={BellRing}
          iconClassName="text-[#246392]"
          title="Push Notifications"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        >
          <BannerButton onClick={() => openSendModal()}>Send Notification</BannerButton>
        </PageBanner>

        <PushNotificationFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          center={centerFilter}
          onCenterChange={(e) => setCenterFilter(e.target.value)}
          selectedDate={dateFilter}
          onDateChange={setDateFilter}
        />

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage={emptyMessage}
          itemLabel="notifications"
          resetDeps={[search, centerFilter, dateFilter]}
          rowClassName="transition-colors duration-200"
          zebraStriping
          stickyHeader
          density="comfortable"
          tableMinWidth={1180}
          gradientActivePage
          className="overflow-hidden rounded-xl border border-slate-100/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)]"
          tableClassName="rounded-xl"
          paginationClassName="rounded-b-xl bg-slate-50/50"
        />
      </section>

      <SendPushNotificationModal
        open={sendModalOpen}
        onClose={closeSendModal}
        editing={editingRow}
        onSubmit={handleSaveNotification}
      />

      <NotificationMessageModal
        open={Boolean(messageModal)}
        message={messageModal || ''}
        onClose={closeMessageModal}
      />

      <CrmDeleteConfirmDialog
        open={deleteNotificationId != null}
        onCancel={() => setDeleteNotificationId(null)}
        onConfirm={handleConfirmDeleteNotification}
      />
    </div>
  )
}
