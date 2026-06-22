import { useCallback, useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import RewardsPageShell from '../../../components/rewards/RewardsPageShell'
import AdminDataPanel from '../../../components/admin/AdminDataPanel'
import AdminStandardTable from '../../../components/admin/AdminStandardTable'
import LeaderboardTabs from '../../../components/rewards/LeaderboardTabs'
import RankBadge from '../../../components/rewards/RankBadge'
import { getLeaderboard } from '../../../services/rewardService'
import { formatCoins } from '../../../utils/rewardApiHelpers'
import { getApiErrorMessage } from '../../../utils/apiError'
import { cn } from '../../../utils/cn'
import { toast } from '@/utils/toast'

export default function LeaderboardsPage() {
  const [period, setPeriod] = useState('weekly')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getLeaderboard(period)
      setRows(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load leaderboard'))
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  const columns = [
    { key: 'rank', label: 'Rank', render: (r) => <RankBadge rank={r.rank} /> },
    {
      key: 'studentName',
      label: 'Student Name',
      render: (r) => (
        <span className={cn('font-medium', r.rank <= 3 && 'text-[#1a3a5c]')}>{r.studentName}</span>
      ),
    },
    { key: 'coinsEarned', label: 'Coins Earned', render: (r) => formatCoins(r.coinsEarned) },
  ]

  return (
    <RewardsPageShell icon={Trophy} title="Leaderboard Management">
      <AdminDataPanel
        toolbar={<LeaderboardTabs value={period} onChange={setPeriod} />}
        tableClassName="mt-4"
      >
        <AdminStandardTable columns={columns} data={rows} loading={loading} stickyHeader itemLabel="students" />
      </AdminDataPanel>
    </RewardsPageShell>
  )
}
