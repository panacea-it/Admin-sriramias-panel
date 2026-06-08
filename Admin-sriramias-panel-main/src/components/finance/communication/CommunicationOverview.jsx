import FinanceStatCard from '../FinanceStatCard'
import FinanceChartContainer from '../FinanceChartContainer'
import { CommunicationActivityChart, CommunicationChannelChart, CommunicationDeliveryTrendChart } from './CommunicationCharts'
import { MessageSquare, CheckCircle2, XCircle, Eye, BookOpen, Bell, Zap } from 'lucide-react'

export default function CommunicationOverview({ summary, charts, activeRules, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <FinanceStatCard icon={MessageSquare} label="Total communications" value={summary?.total ?? 0} />
        <FinanceStatCard icon={CheckCircle2} label="Successful deliveries" value={summary?.delivered ?? 0} accent="from-[#69df66] to-[#55ace7]" />
        <FinanceStatCard icon={XCircle} label="Failed communications" value={summary?.failed ?? 0} accent="from-[#df8284] to-[#b8887a]" />
        <FinanceStatCard icon={Eye} label="Open rate" value={`${summary?.openRate ?? 0}%`} accent="from-[#55ace7] to-[#246392]" />
        <FinanceStatCard icon={BookOpen} label="Read rate" value={`${summary?.readRate ?? 0}%`} accent="from-violet-400 to-violet-600" />
        <FinanceStatCard icon={Bell} label="Pending follow-ups" value={summary?.pendingFollowUps ?? 0} accent="from-amber-400 to-amber-600" />
        <FinanceStatCard icon={Zap} label="Active automation rules" value={activeRules ?? 0} accent="from-[#246392] to-[#1a3a5c]" />
      </div>

      <FinanceChartContainer className="lg:grid-cols-3">
        <CommunicationActivityChart data={charts?.dailyActivity} className="lg:col-span-2" />
        <CommunicationChannelChart data={charts?.channelUsage} />
      </FinanceChartContainer>

      <FinanceChartContainer className="lg:grid-cols-2">
        <CommunicationDeliveryTrendChart data={charts?.deliveryTrend} />
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Delivery highlights</h3>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-[#686868]">Delivery rate</dt>
              <dd className="font-bold text-[#246392]">{summary?.deliveryRate ?? 0}%</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#686868]">Open rate</dt>
              <dd className="font-semibold">{summary?.openRate ?? 0}%</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-[#686868]">Read rate</dt>
              <dd className="font-semibold">{summary?.readRate ?? 0}%</dd>
            </div>
          </dl>
        </div>
      </FinanceChartContainer>
    </div>
  )
}
