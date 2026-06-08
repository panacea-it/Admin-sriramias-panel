import { useCallback, useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Phone,
  TrendingUp,
  AlertCircle,
  Radio,
} from 'lucide-react'
import SalesPageShell from '../../components/sales-analytics/SalesPageShell'
import SalesStatCard from '../../components/sales-analytics/SalesStatCard'
import SalesChartPanel from '../../components/sales-analytics/SalesChartPanel'
import SalesFunnelChart from '../../components/sales-analytics/SalesFunnelChart'
import ProgressBar from '../../components/figma/ProgressBar'
import { fetchSalesDashboard } from '../../api/salesAnalyticsAPI'
import { useSalesPermissions } from '../../hooks/useSalesPermissions'
import { toast } from '../../utils/toast'

export default function LeadDashboardPage() {
  const { isCounselor, isTeamLead, isSalesHead, isSuperAdmin } = useSalesPermissions()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchSalesDashboard()
      setData(res)
    } catch {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  }, [load])

  const stats = data?.stats

  const statCards = isCounselor
    ? [
        { label: 'Assigned Leads', value: stats?.assignedLeads, icon: Users, key: 'assigned' },
        { label: "Today's Follow-ups", value: stats?.todayFollowUps, icon: CalendarClock, key: 'followups' },
        { label: 'Pending Callbacks', value: stats?.pendingCallbacks, icon: Phone, key: 'callbacks' },
        { label: 'Conversions', value: stats?.conversions, icon: TrendingUp, key: 'conv' },
      ]
    : isTeamLead
      ? [
          { label: 'Team Leads', value: stats?.totalLeads, icon: Users, key: 'team' },
          { label: 'Pending Follow-ups', value: stats?.pendingCallbacks, icon: CalendarClock, key: 'pending' },
          { label: 'Conversion Rate', value: stats?.conversionRate, icon: TrendingUp, key: 'rate' },
          { label: 'Payment Failures', value: stats?.paymentFailures, icon: AlertCircle, key: 'fail' },
        ]
      : [
          { label: 'Total Leads', value: stats?.totalLeads, icon: Users, key: 'total' },
          { label: 'Live Visitors', value: stats?.liveVisitors, icon: Radio, key: 'live' },
          { label: 'Conversion Rate', value: stats?.conversionRate, icon: TrendingUp, key: 'rate' },
          { label: 'Conversions', value: stats?.conversions, icon: TrendingUp, key: 'conv' },
        ]

  return (
    <SalesPageShell icon={LayoutDashboard} title="Lead Dashboard">
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white shadow" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card, i) => (
              <SalesStatCard
                key={card.key}
                label={card.label}
                value={card.value?.toLocaleString?.() ?? card.value}
                icon={card.icon}
                index={i}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SalesChartPanel title="Conversion Funnel">
              <SalesFunnelChart stages={data?.funnel || []} />
            </SalesChartPanel>

            <SalesChartPanel title="Lead Sources">
              <div className="space-y-3">
                {(data?.sourceBreakdown || []).map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <ProgressBar value={item.value} color={item.color} />
                  </div>
                ))}
              </div>
            </SalesChartPanel>
          </div>

          <SalesChartPanel title="Live Activity Feed">
            <ul className="divide-y divide-[#f0f0f0]">
              {(data?.recentActivity || []).map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <span className="font-medium text-[#111]">{item.message}</span>
                  <span className="shrink-0 text-xs text-[#9ca0a8]">{item.time}</span>
                </li>
              ))}
            </ul>
          </SalesChartPanel>
        </>
      )}
    </SalesPageShell>
  )
}
