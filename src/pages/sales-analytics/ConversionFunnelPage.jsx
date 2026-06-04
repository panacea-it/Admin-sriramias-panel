import { useEffect, useState } from 'react'
import { Filter } from 'lucide-react'
import SalesPageShell from '../../components/sales-analytics/SalesPageShell'
import SalesChartPanel from '../../components/sales-analytics/SalesChartPanel'
import SalesFunnelChart from '../../components/sales-analytics/SalesFunnelChart'
import ProgressBar from '../../components/figma/ProgressBar'
import { fetchFunnelAnalytics } from '../../api/salesAnalyticsAPI'

function BarChart({ data, labelKey, valueKey }) {
  const max = Math.max(...data.map((d) => d[valueKey]), 1)
  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((item) => (
        <div key={item[labelKey]} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-[#246392] to-[#55ace7]"
            style={{ height: `${Math.max(8, (item[valueKey] / max) * 100)}%` }}
          />
          <span className="text-[10px] font-medium text-[#686868]">{item[labelKey]}</span>
        </div>
      ))}
    </div>
  )
}

export default function ConversionFunnelPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetchFunnelAnalytics().then(setData)
  }, [])

  return (
    <SalesPageShell icon={Filter} title="Conversion Funnel">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SalesChartPanel title="Funnel stages">
          <SalesFunnelChart stages={data?.stages || []} />
          <p className="mt-4 text-center text-sm font-semibold text-[#246392]">
            Visitors → Course View → Payment Page → Payment Success
          </p>
        </SalesChartPanel>

        <SalesChartPanel title="Source-wise conversion">
          <div className="space-y-4">
            {(data?.sourceWise || []).map((row) => (
              <div key={row.source}>
                <div className="mb-1 flex justify-between text-sm font-semibold">
                  <span>{row.source}</span>
                  <span>
                    {row.converted}/{row.visitors} (
                    {((row.converted / row.visitors) * 100).toFixed(1)}%)
                  </span>
                </div>
                <ProgressBar value={(row.converted / row.visitors) * 100} color="#246392" />
              </div>
            ))}
          </div>
        </SalesChartPanel>

        <SalesChartPanel title="Weekly trend" className="lg:col-span-2">
          <BarChart data={data?.timeSeries || []} labelKey="date" valueKey="conversions" />
        </SalesChartPanel>
      </div>
    </SalesPageShell>
  )
}
