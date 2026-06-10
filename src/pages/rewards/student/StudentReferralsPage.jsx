import { useCallback, useEffect, useState } from 'react'
import { Link2, Copy, Share2 } from 'lucide-react'
import PageBanner from '../../../components/figma/PageBanner'
import StudentPortalTabs from '../../../components/rewards/StudentPortalTabs'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import RewardsStatCard from '../../../components/rewards/RewardsStatCard'
import { Users, UserCheck, ShoppingBag, Coins } from 'lucide-react'
import { getStudentReferrals } from '../../../services/rewardService'
import { formatCoins } from '../../../utils/rewardApiHelpers'
import { toast } from '@/utils/toast'

export default function StudentReferralsPage() {
  const [data, setData] = useState(null)

  const load = useCallback(async () => {
    const result = await getStudentReferrals()
    setData(result)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const copyLink = () => {
    if (data?.link) {
      navigator.clipboard?.writeText(data.link)
      toast.success('Referral link copied')
    }
  }

  const columns = [
    { key: 'studentName', label: 'Student' },
    { key: 'registrationStatus', label: 'Registration' },
    { key: 'purchaseStatus', label: 'Purchase' },
    { key: 'coinsEarned', label: 'Coins', render: (r) => formatCoins(r.coinsEarned) },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageBanner icon={Link2} title="Referrals" />
      <StudentPortalTabs />
      {data && (
        <>
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-md sm:flex-row sm:items-center">
            <input readOnly value={data.link} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            <button type="button" onClick={copyLink} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold">
              <Copy className="h-4 w-4" /> Copy
            </button>
            <button type="button" onClick={() => toast.info('Share opened')} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 py-2.5 text-sm font-semibold text-white">
              <Share2 className="h-4 w-4" /> Share
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <RewardsStatCard icon={Users} label="Total referrals" value={String(data.stats?.total ?? 0)} />
            <RewardsStatCard icon={UserCheck} label="Registered" value={String(data.stats?.registered ?? 0)} />
            <RewardsStatCard icon={ShoppingBag} label="Purchased" value={String(data.stats?.purchased ?? 0)} />
            <RewardsStatCard icon={Coins} label="Coins earned" value={formatCoins(data.stats?.coinsEarned)} />
          </div>
          <PaginatedFigmaTable columns={columns} data={data.table || []} stickyHeader />
        </>
      )}
    </div>
  )
}
