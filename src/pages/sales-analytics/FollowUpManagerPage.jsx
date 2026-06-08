import { useEffect, useState } from 'react'
import { CalendarClock, Plus } from 'lucide-react'
import SalesPageShell from '../../components/sales-analytics/SalesPageShell'
import SalesFilterToolbar from '../../components/sales-analytics/SalesFilterToolbar'
import SalesStatusBadge from '../../components/sales-analytics/SalesStatusBadge'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import Modal from '../../components/ui/Modal'
import { fetchFollowUps, createFollowUp } from '../../api/salesAnalyticsAPI'
import { toast } from '../../utils/toast'

export default function FollowUpManagerPage() {
  const [followUps, setFollowUps] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ leadId: '', scheduledAt: '', notes: '', priority: 'Normal' })

  const load = () => fetchFollowUps().then((res) => setFollowUps(res.followUps || []))

  useEffect(() => {
    load()
  }, [])

  const filtered = followUps.filter((f) => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q || f.studentName?.toLowerCase().includes(q) || f.leadId?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || f.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createFollowUp(form)
      toast.success('Follow-up scheduled')
      setModalOpen(false)
      setForm({ leadId: '', scheduledAt: '', notes: '', priority: 'Normal' })
      load()
    } catch {
      toast.error('Failed to schedule follow-up')
    }
  }

  const columns = [
    { key: 'leadId', label: 'Lead ID' },
    { key: 'studentName', label: 'Student' },
    { key: 'counselorName', label: 'Counselor' },
    { key: 'scheduledAt', label: 'Scheduled' },
    { key: 'status', label: 'Status', render: (r) => <SalesStatusBadge status={r.status} /> },
    { key: 'priority', label: 'Priority', render: (r) => <SalesStatusBadge status={r.priority} /> },
    { key: 'notes', label: 'Notes', cellClassName: 'max-w-[200px] truncate' },
  ]

  return (
    <SalesPageShell
      icon={CalendarClock}
      title="Follow-up Manager"
      actions={
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152d48]"
        >
          <Plus className="h-4 w-4" />
          Schedule
        </button>
      }
    >
      <SalesFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search follow-ups..."
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All' },
              { value: 'Overdue', label: 'Overdue' },
              { value: 'Today', label: 'Today' },
              { value: 'Upcoming', label: 'Upcoming' },
            ],
          },
        ]}
      />
      <PaginatedFigmaTable columns={columns} data={filtered} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="md">
        <form onSubmit={handleCreate} className="space-y-4 p-2">
          <h3 className="text-lg font-bold text-[#111]">Schedule follow-up</h3>
          <input
            required
            placeholder="Lead ID"
            value={form.leadId}
            onChange={(e) => setForm({ ...form, leadId: e.target.value })}
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
          />
          <input
            required
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
          />
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
          >
            <option value="Normal">Normal</option>
            <option value="High">High</option>
          </select>
          <textarea
            placeholder="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border px-4 py-2 text-sm font-semibold">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-[#246392] px-4 py-2 text-sm font-semibold text-white">
              Save
            </button>
          </div>
        </form>
      </Modal>
    </SalesPageShell>
  )
}
