import { useCallback, useMemo, useState } from 'react'
import { BellRing } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import { BannerButton } from '../../components/academics/AcademicsUi'
import PushNotificationFilterToolbar from '../../components/push-notifications/PushNotificationFilterToolbar'
import PushNotificationsTable from '../../components/push-notifications/PushNotificationsTable'
import SendPushNotificationModal from '../../components/push-notifications/SendPushNotificationModal'
import CrmDeleteConfirmDialog from '../../components/crm/CrmDeleteConfirmDialog'
import {
  INITIAL_PUSH_NOTIFICATIONS,
  formatNotificationStatusLabel,
  getNotificationStatusOptions,
  pushNotificationMatchesSelectedDate,
} from '../../data/pushNotificationsData'

export default function PushNotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_PUSH_NOTIFICATIONS)
  const [search, setSearch] = useState('')
  const [centerFilter, setCenterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [statusById, setStatusById] = useState(() =>
    Object.fromEntries(INITIAL_PUSH_NOTIFICATIONS.map((row) => [row.id, ''])),
  )
  const [dateFilter, setDateFilter] = useState(null)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [deleteNotificationId, setDeleteNotificationId] = useState(null)

  const statusOptions = useMemo(() => getNotificationStatusOptions({ includePlaceholder: true }), [])

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
        formatNotificationStatusLabel(statusById[row.id] || '').toLowerCase().includes(q)
      const matchCenter = centerFilter === 'all' || row.center === centerFilter
      const rowStatus = statusById[row.id] || ''
      const matchStatus = statusFilter === 'all' || rowStatus === statusFilter
      const matchDate = pushNotificationMatchesSelectedDate(row, dateFilter)
      return matchSearch && matchCenter && matchStatus && matchDate
    })
  }, [notifications, search, centerFilter, statusFilter, statusById, dateFilter])

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
      setStatusById((prev) => ({ ...prev, [notification.id]: '' }))
      toast.success('Notification sent successfully')
    } else {
      setNotifications((prev) =>
        prev.map((row) => (row.id === notification.id ? notification : row)),
      )
      toast.success('Notification updated successfully')
    }
  }, [])

  const handleStatusChange = useCallback((id, value) => {
    setStatusById((prev) => ({ ...prev, [id]: value }))
  }, [])

  const handleDelete = useCallback((id) => {
    setNotifications((prev) => prev.filter((row) => row.id !== id))
    setStatusById((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    toast.success('Notification deleted')
  }, [])

  const handleConfirmDeleteNotification = useCallback(() => {
    if (deleteNotificationId == null) return
    handleDelete(deleteNotificationId)
    setDeleteNotificationId(null)
  }, [deleteNotificationId, handleDelete])

  const emptyMessage = dateFilter
    ? 'No push notifications found for the selected date.'
    : 'No notifications match your filters.'

  const tableResetDeps = [search, centerFilter, statusFilter, dateFilter]

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto w-full max-w-screen-2xl space-y-5 sm:space-y-6">
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
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          selectedDate={dateFilter}
          onDateChange={setDateFilter}
        />

        <PushNotificationsTable
          data={filtered}
          emptyMessage={emptyMessage}
          resetDeps={tableResetDeps}
          statusById={statusById}
          statusOptions={statusOptions}
          onStatusChange={handleStatusChange}
          onEdit={openSendModal}
          onDelete={setDeleteNotificationId}
        />
      </section>

      <SendPushNotificationModal
        open={sendModalOpen}
        onClose={closeSendModal}
        editing={editingRow}
        onSubmit={handleSaveNotification}
      />

      <CrmDeleteConfirmDialog
        open={deleteNotificationId != null}
        onCancel={() => setDeleteNotificationId(null)}
        onConfirm={handleConfirmDeleteNotification}
      />
    </div>
  )
}
