import { useCallback, useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageBanner from '../../../components/figma/PageBanner'
import StudentPortalTabs from '../../../components/rewards/StudentPortalTabs'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import RewardsStatCard from '../../../components/rewards/RewardsStatCard'
import { Coins, Gift, Clock, TrendingUp } from 'lucide-react'
import { getStudentWalletData } from '../../../services/rewardService'
import { formatCoins, formatCoinsInr } from '../../../utils/rewardApiHelpers'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { STUDENT_REWARDS_ROUTES } from '../../../constants/rewardsNav'
import { PAID_STUDENT_REWARDS, FREE_STUDENT_REWARDS, WALLET_RULES } from '../../../constants/rewards'
import { cn } from '../../../utils/cn'

const TABS = ['overview', 'transactions', 'earn', 'expiring', 'referral']

export default function StudentWalletPage() {
  const [tab, setTab] = useState('overview')
  const [data, setData] = useState(null)

  const load = useCallback(async () => {
    const result = await getStudentWalletData()
    setData(result)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const txColumns = [
    { key: 'date', label: 'Date', render: (r) => formatCategoryDateTime(r.date) },
    { key: 'source', label: 'Activity' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Coins', render: (r) => formatCoins(r.amount) },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageBanner icon={Wallet} title="My Wallet">
        <Link to={STUDENT_REWARDS_ROUTES.redeem} className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 text-sm font-semibold text-white">
          Redeem coins
        </Link>
      </PageBanner>
      <StudentPortalTabs />
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold capitalize',
              tab === t ? 'bg-gradient-to-r from-[#55ace7] to-[#246392] text-white' : 'bg-white shadow-sm',
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {data && tab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <RewardsStatCard icon={Coins} label="Available" value={formatCoins(data.balance)} subValue={formatCoinsInr(data.balance)} />
          <RewardsStatCard icon={TrendingUp} label="Lifetime earned" value={formatCoins(data.lifetimeEarned)} />
          <RewardsStatCard icon={Gift} label="Lifetime redeemed" value={formatCoins(data.redeemedCoins)} />
          <RewardsStatCard icon={Clock} label="Expired" value={formatCoins(data.expiredCoins ?? 0)} />
        </div>
      )}
      {tab === 'transactions' && <PaginatedFigmaTable columns={txColumns} data={data?.transactions || []} stickyHeader />}
      {tab === 'earn' && (
        <div className="rounded-xl bg-white p-5 text-sm text-slate-700 shadow-md">
          <p className="font-semibold">Wallet rules: no transfer, no cash withdrawal; partial payment allowed.</p>
          <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">
            {JSON.stringify({ rules: WALLET_RULES, paid: PAID_STUDENT_REWARDS, free: FREE_STUDENT_REWARDS }, null, 2)}
          </pre>
        </div>
      )}
      {tab === 'expiring' && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {formatCoins(data?.expiringCoins ?? 0)} expiring on {data?.expiringOn || '—'}
        </p>
      )}
      {tab === 'referral' && (
        <Link to={STUDENT_REWARDS_ROUTES.referrals} className="text-sm font-semibold text-[#246392] underline">
          Open referral rewards →
        </Link>
      )}
    </div>
  )
}
