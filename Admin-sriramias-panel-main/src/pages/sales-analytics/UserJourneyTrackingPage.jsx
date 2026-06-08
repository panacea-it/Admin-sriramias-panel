import { useEffect, useState } from 'react'
import { Route, Search } from 'lucide-react'
import SalesPageShell from '../../components/sales-analytics/SalesPageShell'
import SalesTimeline from '../../components/sales-analytics/SalesTimeline'
import SalesChartPanel from '../../components/sales-analytics/SalesChartPanel'
import { fetchUserJourney, fetchSalesLeads } from '../../api/salesAnalyticsAPI'
import { useSalesPermissions } from '../../hooks/useSalesPermissions'

export default function UserJourneyTrackingPage() {
  const { filterLeadsForRole } = useSalesPermissions()
  const [leads, setLeads] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSalesLeads().then((res) => {
      const list = filterLeadsForRole(res.leads || res)
      setLeads(list)
      if (list[0]) setSelectedId(list[0].id)
    })
  }, [filterLeadsForRole])

  useEffect(() => {
    if (!selectedId) return
    fetchUserJourney(selectedId).then((res) => setEvents(res.events || []))
  }, [selectedId])

  const filteredLeads = leads.filter(
    (l) =>
      !search.trim() ||
      l.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      l.id?.toLowerCase().includes(search.toLowerCase()),
  )

  const selected = leads.find((l) => l.id === selectedId)

  return (
    <SalesPageShell icon={Route} title="User Journey Tracking">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SalesChartPanel title="Select lead" className="lg:col-span-1">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca0a8]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="w-full rounded-xl border border-[#e5e7eb] py-2.5 pl-10 pr-3 text-sm"
            />
          </div>
          <ul className="max-h-[420px] space-y-1 overflow-y-auto">
            {filteredLeads.map((lead) => (
              <li key={lead.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(lead.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm transition ${
                    selectedId === lead.id
                      ? 'bg-[#246392] font-semibold text-white'
                      : 'hover:bg-[#f0f4f8] text-[#111]'
                  }`}
                >
                  <span className="block font-medium">{lead.studentName}</span>
                  <span className="text-xs opacity-80">{lead.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </SalesChartPanel>

        <SalesChartPanel title={selected ? `Journey — ${selected.studentName}` : 'Journey timeline'} className="lg:col-span-2">
          {selected && (
            <div className="mb-4 flex flex-wrap gap-2 text-xs text-[#686868]">
              <span>Course: {selected.interestedCourse}</span>
              <span>·</span>
              <span>Source: {selected.source}</span>
              <span>·</span>
              <span>Status: {selected.status}</span>
            </div>
          )}
          <SalesTimeline events={events} />
        </SalesChartPanel>
      </div>
    </SalesPageShell>
  )
}
