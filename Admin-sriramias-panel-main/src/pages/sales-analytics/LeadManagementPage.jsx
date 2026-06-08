import { useCallback, useEffect, useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import SalesPageShell from '../../components/sales-analytics/SalesPageShell'
import SalesFilterToolbar from '../../components/sales-analytics/SalesFilterToolbar'
import SalesStatusBadge from '../../components/sales-analytics/SalesStatusBadge'
import SalesTableSkeleton from '../../components/sales-analytics/SalesTableSkeleton'
import LeadDetailDrawer from '../../components/sales-analytics/LeadDetailDrawer'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { fetchSalesLeads, fetchUserJourney } from '../../api/salesAnalyticsAPI'
import { LEAD_SOURCES, LEAD_STATUSES } from '../../data/salesAnalyticsMockData'
import { useSalesPermissions } from '../../hooks/useSalesPermissions'
import { toast } from '../../utils/toast'

export default function LeadManagementPage() {
  const { filterLeadsForRole, canExport } = useSalesPermissions()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [journeyEvents, setJourneyEvents] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchSalesLeads()
      setLeads(filterLeadsForRole(res.leads || res))
    } catch {
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [filterLeadsForRole])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((row) => {
      const matchSearch =
        !q ||
        row.studentName?.toLowerCase().includes(q) ||
        row.mobile?.includes(q) ||
        row.email?.toLowerCase().includes(q) ||
        row.id?.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      const matchSource = sourceFilter === 'all' || row.source === sourceFilter
      return matchSearch && matchStatus && matchSource
    })
  }, [leads, search, statusFilter, sourceFilter])

  const openLead = async (row) => {
    setSelected(row)
    setDrawerOpen(true)
    try {
      const journey = await fetchUserJourney(row.id)
      setJourneyEvents(journey.events || [])
    } catch {
      setJourneyEvents([])
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'Lead ID',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10 font-mono text-xs',
    },
    { key: 'studentName', label: 'Student Name', render: (r) => <span className="font-medium">{r.studentName}</span> },
    { key: 'mobile', label: 'Mobile' },
    { key: 'email', label: 'Email', cellClassName: 'max-w-[160px] truncate' },
    { key: 'interestedCourse', label: 'Interested Course' },
    { key: 'source', label: 'Source' },
    { key: 'counselorName', label: 'Counselor' },
    { key: 'status', label: 'Status', render: (r) => <SalesStatusBadge status={r.status} /> },
    { key: 'paymentStatus', label: 'Payment', render: (r) => <SalesStatusBadge status={r.paymentStatus} /> },
    { key: 'lastActivity', label: 'Last Activity' },
    { key: 'createdAt', label: 'Created' },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <button
          type="button"
          onClick={() => openLead(r)}
          className="text-sm font-semibold text-[#246392] hover:underline"
        >
          View
        </button>
      ),
    },
  ]

  return (
    <SalesPageShell icon={Users} title="Lead Management">
      <SalesFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search leads by name, mobile, email, ID..."
        filters={[
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [{ value: 'all', label: 'All statuses' }, ...LEAD_STATUSES.map((s) => ({ value: s, label: s }))],
          },
          {
            key: 'source',
            value: sourceFilter,
            onChange: setSourceFilter,
            options: [{ value: 'all', label: 'All sources' }, ...LEAD_SOURCES.map((s) => ({ value: s, label: s }))],
          },
        ]}
        onExport={canExport ? () => toast.success('CSV export started') : undefined}
        exportLabel="Export CSV"
      />

      {loading ? (
        <SalesTableSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl bg-white px-6 py-12 text-center text-sm text-[#686868] shadow">
          No leads match your filters.
        </p>
      ) : (
        <PaginatedFigmaTable columns={columns} data={filtered} />
      )}

      <LeadDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        lead={selected}
        journeyEvents={journeyEvents}
        onUpdated={load}
      />
    </SalesPageShell>
  )
}
