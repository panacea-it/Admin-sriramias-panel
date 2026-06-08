import { useCallback, useEffect, useState } from 'react'
import { Coins, Trophy, Award, Clock, Gift, TrendingUp } from 'lucide-react'
import PageBanner from '../../../components/figma/PageBanner'
import StudentPortalTabs from '../../../components/rewards/StudentPortalTabs'
import RewardsStatCard from '../../../components/rewards/RewardsStatCard'
import { RewardDistributionLineChart } from '../../../components/rewards/RewardsCharts'
import { getStudentRewardsOverview } from '../../../services/rewardService'
import { formatCoins } from '../../../utils/rewardApiHelpers'
import { Link } from 'react-router-dom'
import { STUDENT_REWARDS_ROUTES } from '../../../constants/rewardsNav'

export default function StudentRewardsOverviewPage() {
  const [data, setData] = useState(null)

  const load = useCallback(async () => {
    const result = await getStudentRewardsOverview()
    setData(result)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const chartData = [
    { date: 'Mon', coins: 12 },
    { date: 'Tue', coins: 8 },
    { date: 'Wed', coins: 15 },
    { date: 'Thu', coins: 5 },
    { date: 'Fri', coins: 20 },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageBanner icon={Coins} title="Rewards Overview" />
      <StudentPortalTabs />
      <div className="flex flex-wrap gap-2">
        <QuickLink to={STUDENT_REWARDS_ROUTES.wallet} label="View wallet" />
        <QuickLink to={STUDENT_REWARDS_ROUTES.redeem} label="Redeem coins" />
        <QuickLink to={STUDENT_REWARDS_ROUTES.referrals} label="Refer a friend" />
      </div>
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <RewardsStatCard icon={Coins} label="Current balance" value={formatCoins(data.balance)} />
          <RewardsStatCard icon={TrendingUp} label="Lifetime earned" value={formatCoins(data.lifetimeEarned)} />
          <RewardsStatCard icon={Gift} label="Redeemed" value={formatCoins(data.redeemedCoins)} />
          <RewardsStatCard icon={Award} label="Active badges" value={String(data.activeBadges)} />
          <RewardsStatCard icon={Trophy} label="Current rank" value={`#${data.currentRank}`} />
          <RewardsStatCard icon={Clock} label="Expiring soon" value={formatCoins(data.expiringCoins)} tone="warning" />
        </div>
      )}
      <div className="rounded-xl bg-white p-4 shadow-md">
        <h3 className="text-sm font-bold text-slate-800">Reward summary</h3>
        <RewardDistributionLineChart data={chartData} />
      </div>
    </div>
  )
}

function QuickLink({ to, label }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-[40px] items-center rounded-lg bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-md"
    >
      {label}
    </Link>
  )
}
