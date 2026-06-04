import { useMemo, useState } from 'react'
import { BellRing, Edit3, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { BannerButton } from '../../components/academics/AcademicsUi'
import PushNotificationFilterToolbar from '../../components/push-notifications/PushNotificationFilterToolbar'
import SendPushNotificationModal from '../../components/push-notifications/SendPushNotificationModal'
import { INITIAL_PUSH_NOTIFICATIONS } from '../../data/pushNotificationsData'

function DateCell({ time, date }) {
  return (
    <div className="flex flex-col gap-0.5 leading-snug">
      <span>
        {time}
        <span className="text-[#9ca0a8]"> ,</span>
      </span>
      <span className="text-[#686868]">{date}</span>
    </div>
  )
}

function MessageCell({ message }) {
  return <p className="max-w-md leading-snug text-[#333]">{message}</p>
}

export default function PushNotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_PUSH_NOTIFICATIONS)
  const [search, setSearch] = useState('')
  const [centerFilter, setCenterFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return notifications.filter((row) => {
      const matchSearch =
        !q ||
        String(row.id).includes(q) ||
        row.sentBy.toLowerCase().includes(q) ||
        row.message.toLowerCase().includes(q) ||
        row.device.toLowerCase().includes(q) ||
        row.center.toLowerCase().includes(q)
      const matchCenter = centerFilter === 'all' || row.center === centerFilter
      const matchDate = dateFilter === 'all' || row.dateBucket === dateFilter
      const matchType =
        typeFilter === 'all' ||
        typeFilter === 'All' ||
        row.type.toLowerCase() === typeFilter.toLowerCase()
      return matchSearch && matchCenter && matchDate && matchType
    })
  }, [notifications, search, centerFilter, dateFilter, typeFilter])

  const openSendModal = (row = null) => {
    setEditingRow(row)
    setSendModalOpen(true)
  }

  const closeSendModal = () => {
    setSendModalOpen(false)
    setEditingRow(null)
  }

  const handleSaveNotification = (notification, mode) => {
    if (mode === 'create') {
      setNotifications((prev) => [notification, ...prev])
      toast.success('Notification sent successfully')
    } else {
      setNotifications((prev) =>
        prev.map((row) => (row.id === notification.id ? notification : row)),
      )
      toast.success('Notification updated successfully')
    }
  }

  const handleDelete = (id) => {
    setNotifications((prev) => prev.filter((row) => row.id !== id))
    toast.success('Notification deleted')
  }

  const columns = [
    {
      key: 'id',
      label: 'ID',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10 align-middle font-semibold',
    },
    { key: 'sentBy', label: 'Sent By', cellClassName: 'align-middle' },
    { key: 'device', label: 'Device', cellClassName: 'align-middle' },
    {
      key: 'message',
      label: 'Message',
      cellClassName: 'align-middle max-w-md',
      render: (row) => <MessageCell message={row.message} />,
    },
    { key: 'center', label: 'Center', cellClassName: 'align-middle' },
    { key: 'type', label: 'Type', cellClassName: 'align-middle' },
    {
      key: 'date',
      label: 'Date',
      cellClassName: 'align-middle whitespace-nowrap',
      render: (row) => <DateCell time={row.sentTime} date={row.sentDate} />,
    },
    {
      key: 'action',
      label: 'Action',
      headerClassName: 'pr-6 sm:pr-10',
      cellClassName: 'pr-6 sm:pr-10 align-middle',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-4 sm:gap-5">
          <button
            type="button"
            onClick={() => openSendModal(row)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#686868] transition hover:text-[#246392] sm:text-base"
          >
            <Edit3 className="h-4 w-4" strokeWidth={2.35} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#c96565] transition hover:text-[#b94b4b] sm:text-base"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.1} />
            Delete
          </button>
        </div>
      ),
    },
  ]

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
          dateRange={dateFilter}
          onDateRangeChange={(e) => setDateFilter(e.target.value)}
          type={typeFilter}
          onTypeChange={(e) => setTypeFilter(e.target.value)}
        />

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage="No notifications match your filters."
          itemLabel="notifications"
          resetDeps={[search, centerFilter, dateFilter, typeFilter]}
          rowClassName="hover:bg-slate-50/90"
        />
      </section>

      <SendPushNotificationModal
        open={sendModalOpen}
        onClose={closeSendModal}
        editing={editingRow}
        onSubmit={handleSaveNotification}
      />
    </div>
  )
}
