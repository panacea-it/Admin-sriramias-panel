import { useMemo, useState } from 'react'
import { Coins, Gift, Users, Clock, ShieldAlert, UserPlus, Download, RefreshCw, LayoutDashboard } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import RewardsStatCard from '../../../components/rewards/RewardsStatCard'
import {
  RewardDistributionLineChart,
  RedemptionBarChart,
} from '../../../components/rewards/RewardsCharts'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import RankBadge from '../../../components/rewards/RankBadge'
import RewardsTableSkeleton from '../../../components/rewards/RewardsTableSkeleton'
import RewardsErrorState from '../../../components/rewards/RewardsErrorState'
import { useRewardDashboard } from '../../../hooks/useRewardDashboard'
import { formatCoins } from '../../../utils/rewardApiHelpers'
import { toast } from '@/utils/toast'
import { cn } from '../../../utils/cn'

export default function RewardDashboardPage() {
  const [dateRange, setDateRange] = useState('6m')
  const { data, loading, loadError, reload } = useRewardDashboard('weekly')

  const stats = data?.stats
  const leaderboardColumns = useMemo(
    () => [
      { key: 'rank', label: 'Rank', render: (r) => <RankBadge rank={r.rank} /> },
      { key: 'studentName', label: 'Student Name', render: (r) => <span className="font-medium">{r.studentName}</span> },
      { key: 'coinsEarned', label: 'Coins Earned', render: (r) => formatCoins(r.coinsEarned) },
    ],
    [],
  )

  const handleExport = () => {
    toast.success('Analytics export started')
  }

  return (
    <RewardsPageShell
      icon={LayoutDashboard}
      title="Reward Dashboard"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium"
            aria-label="Date range"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="6m">Last 6 months</option>
          </select>
          <button type="button" onClick={handleExport} className={actionBtn}>
            <Download className="h-4 w-4" />
            Export
          </button>
          <button type="button" onClick={reload} className={actionBtn}>
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      }
    >
      {loadError ? (
        <RewardsErrorState message={loadError} onRetry={reload} />
      ) : loading && !data ? (
        <RewardsTableSkeleton rows={4} columns={3} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <RewardsStatCard icon={Coins} label="Total Coins Distributed" value={formatCoins(stats?.totalDistributed)} />
            <RewardsStatCard icon={Gift} label="Total Coins Redeemed" value={formatCoins(stats?.totalRedeemed)} />
            <RewardsStatCard icon={Users} label="Active Reward Users" value={String(stats?.activeUsers ?? 0)} />
            <RewardsStatCard icon={Clock} label="Coins Expiring" value={formatCoins(stats?.coinsExpiring)} tone="warning" />
            <RewardsStatCard icon={ShieldAlert} label="Fraud Alerts" value={String(stats?.fraudAlerts ?? 0)} tone="danger" />
            <RewardsStatCard icon={UserPlus} label="Referral Rewards Issued" value={formatCoins(stats?.referralRewards)} tone="success" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
              <div className="bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-3">
                <h3 className="text-sm font-bold text-white">Reward Distribution Trend</h3>
              </div>
              <div className="p-4">
                <RewardDistributionLineChart data={data?.distributionTrend || []} />
              </div>
            </div>
            <div className="overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
              <div className="bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 py-3">
                <h3 className="text-sm font-bold text-white">Redemption Trend</h3>
              </div>
              <div className="p-4">
                <RedemptionBarChart data={data?.redemptionTrend || []} />
              </div>
            </div>
          </div>
          <PaginatedFigmaTable
            columns={leaderboardColumns}
            data={data?.leaderboard || []}
            loading={loading}
            stickyHeader
            itemLabel="students"
          />
        </>
      )}
    </RewardsPageShell>
  )
}

const actionBtn =
  'inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50'
