import { useEffect, useState } from 'react'
import { PieChart } from 'lucide-react'
import SalesPageShell from '../../components/sales-analytics/SalesPageShell'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import SalesFilterToolbar from '../../components/sales-analytics/SalesFilterToolbar'
import { fetchSourceAnalytics } from '../../api/salesAnalyticsAPI'
import { LEAD_SOURCES } from '../../data/salesAnalyticsMockData'
import { useSalesPermissions } from '../../hooks/useSalesPermissions'

export default function SourceAnalyticsPage() {
  const { canExport } = useSalesPermissions()
  const [sources, setSources] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSourceAnalytics().then((res) => setSources(res.sources || []))
  }, [])

  const filtered = sources.filter(
    (s) => !search.trim() || s.source.toLowerCase().includes(search.toLowerCase()),
  )

  const columns = [
    { key: 'source', label: 'Source', render: (r) => <span className="font-semibold">{r.source}</span> },
    { key: 'leads', label: 'Leads' },
    { key: 'conversions', label: 'Conversions' },
    { key: 'conversionRate', label: 'Conversion %' },
    { key: 'spend', label: 'Ad Spend' },
  ]

  return (
    <SalesPageShell icon={PieChart} title="Source Analytics">
      <SalesFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter by source..."
        filters={[
          {
            key: 'channel',
            value: 'all',
            onChange: () => {},
            options: [{ value: 'all', label: 'All channels' }, ...LEAD_SOURCES.slice(0, 6).map((s) => ({ value: s, label: s }))],
          },
        ]}
        onExport={canExport ? () => {} : undefined}
      />
      <PaginatedFigmaTable columns={columns} data={filtered} />
    </SalesPageShell>
  )
}
