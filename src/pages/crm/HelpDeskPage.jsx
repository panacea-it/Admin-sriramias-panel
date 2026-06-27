import { useCallback, useMemo, useState } from 'react'
import { BellRing } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import HelpDeskFilterToolbar from '../../components/help-desk/HelpDeskFilterToolbar'
import HelpDeskReplyPanel from '../../components/help-desk/HelpDeskReplyPanel'
import HelpDeskDescriptionCell from '../../components/help-desk/HelpDeskDescriptionCell'
import HelpDeskDescriptionModal from '../../components/help-desk/HelpDeskDescriptionModal'
import {
  HelpDeskActionCell,
  HelpDeskContactCell,
  HelpDeskDateCell,
  HelpDeskStatusCell,
} from '../../components/help-desk/helpDeskTableCells'
import {
  helpDeskTicketMatchesSelectedDate,
  INITIAL_HELP_DESK_TICKETS,
} from '../../data/helpDeskData'

const FIRST_CELL = 'pl-6 sm:pl-8'

export default function HelpDeskPage() {
  const [tickets, setTickets] = useState(INITIAL_HELP_DESK_TICKETS)
  const [repliesByTicketId, setRepliesByTicketId] = useState({})
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTicketId, setActiveTicketId] = useState(null)
  const [viewTicketId, setViewTicketId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets.filter((ticket) => {
      const matchSearch =
        !q ||
        ticket.userName.toLowerCase().includes(q) ||
        ticket.email.toLowerCase().includes(q) ||
        ticket.mobile.includes(q) ||
        String(ticket.id).includes(q) ||
        ticket.description.toLowerCase().includes(q)
      const matchStatus =
        statusFilter === 'all' || ticket.status === statusFilter
      const matchDate = helpDeskTicketMatchesSelectedDate(ticket, dateFilter)
      return matchSearch && matchStatus && matchDate
    })
  }, [tickets, search, statusFilter, dateFilter])

  const activeTicket = tickets.find((t) => t.id === activeTicketId)
  const viewTicket = tickets.find((t) => t.id === viewTicketId)

  const openReply = useCallback(
    (ticket) => {
      setViewTicketId(null)
      setActiveTicketId(ticket.id)
      setReplyText(repliesByTicketId[ticket.id] || '')
    },
    [repliesByTicketId],
  )

  const closeReply = useCallback(() => {
    setActiveTicketId(null)
    setReplyText('')
  }, [])

  const openDescription = useCallback((ticket) => {
    setViewTicketId(ticket.id)
  }, [])

  const closeDescription = useCallback(() => {
    setViewTicketId(null)
  }, [])

  const handleStatusChange = useCallback(
    (ticket) => {
      if (ticket.status === 'Replied') {
        toast.info(
          'Tickets cannot be marked as unreplied. You can send a new message to update the reply.',
        )
        return
      }
      openReply(ticket)
      toast.message('Please type your message to mark this ticket as replied.')
    },
    [openReply],
  )

  const handleSendReply = useCallback(() => {
    if (!activeTicket || !replyText.trim()) return

    setSending(true)
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === activeTicket.id
          ? { ...ticket, status: 'Replied' }
          : ticket,
      ),
    )
    setRepliesByTicketId((prev) => ({
      ...prev,
      [activeTicket.id]: replyText.trim(),
    }))
    toast.success('Reply sent successfully')
    setSending(false)
    closeReply()
  }, [activeTicket, replyText, closeReply])

  const emptyMessage = 'No help desk tickets match your filters.'

  const columns = [
    {
      key: 'id',
      label: 'ID',
      headerClassName: `${FIRST_CELL} w-[88px] min-w-[88px]`,
      cellClassName: `${FIRST_CELL} w-[88px] min-w-[88px] align-middle font-semibold text-[#111]`,
    },
    {
      key: 'userName',
      label: 'User Name',
      headerClassName: 'min-w-[128px]',
      cellClassName: 'min-w-[128px] align-middle font-medium text-[#111]',
    },
    {
      key: 'contact',
      label: 'Email ID | Mobile Number',
      headerClassName: 'min-w-[220px]',
      cellClassName: 'min-w-[220px] align-middle',
      render: (row) => (
        <HelpDeskContactCell email={row.email} mobile={row.mobile} />
      ),
    },
    {
      key: 'description',
      label: 'Description',
      headerClassName: 'w-[280px] min-w-[280px]',
      cellClassName: 'w-[280px] min-w-[280px] align-top',
      render: (row) => (
        <HelpDeskDescriptionCell
          description={row.description}
          onView={() => openDescription(row)}
        />
      ),
    },
    {
      key: 'date',
      label: 'Date',
      headerClassName: 'w-[180px] min-w-[180px]',
      cellClassName: 'w-[180px] min-w-[180px] align-middle',
      render: (row) => <HelpDeskDateCell time={row.time} date={row.date} />,
    },
    {
      key: 'status',
      label: 'Status',
      headerClassName: 'w-[140px] min-w-[140px] text-center',
      cellClassName: 'w-[140px] min-w-[140px] align-middle',
      render: (row) => <HelpDeskStatusCell status={row.status} />,
    },
    {
      key: 'action',
      label: 'Action',
      headerClassName: 'w-[168px] min-w-[168px] text-center',
      cellClassName: 'w-[168px] min-w-[168px] align-middle',
      render: (row) => (
        <HelpDeskActionCell
          status={row.status}
          onReply={() => openReply(row)}
          onToggleReplyStatus={() => handleStatusChange(row)}
        />
      ),
    },
  ]

  const descriptionTicket = viewTicket
    ? {
        ...viewTicket,
        replyMessage: repliesByTicketId[viewTicket.id] || '',
      }
    : null

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={BellRing}
          iconClassName="text-[#55ace7]"
          title="Help Desk"
          className="from-[#55ace7] via-[#7eb3d4] to-[#df8284]"
        />

        <HelpDeskFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          selectedDate={dateFilter}
          onDateChange={setDateFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
        />

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage={emptyMessage}
          className="min-w-0 rounded-xl shadow-[0_11px_25px_rgba(15,23,42,0.07)]"
          itemLabel="tickets"
          initialPageSize={10}
          resetDeps={[search, dateFilter, statusFilter]}
          density="helpdesk"
          rowClassName="transition-colors duration-150 hover:bg-[#f8fbff]"
        />
      </section>

      <HelpDeskReplyPanel
        ticket={activeTicket}
        open={Boolean(activeTicket)}
        replyText={replyText}
        onReplyChange={setReplyText}
        onClose={closeReply}
        onSend={handleSendReply}
        sending={sending}
      />

      <HelpDeskDescriptionModal
        ticket={descriptionTicket}
        open={Boolean(viewTicket)}
        onClose={closeDescription}
      />
    </div>
  )
}
