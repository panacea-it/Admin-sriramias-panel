import { useCallback, useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import PageBanner from '../../../components/figma/PageBanner'
import StudentPortalTabs from '../../../components/rewards/StudentPortalTabs'
import LeaderboardTabs from '../../../components/rewards/LeaderboardTabs'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import RankBadge from '../../../components/rewards/RankBadge'
import { getLeaderboard } from '../../../services/rewardService'
import { formatCoins } from '../../../utils/rewardApiHelpers'
import { cn } from '../../../utils/cn'

const CURRENT_STUDENT = 'Rahul Kumar'

export default function StudentLeaderboardPage() {
  const [period, setPeriod] = useState('weekly')
  const [rows, setRows] = useState([])

  const load = useCallback(async () => {
    const data = await getLeaderboard(period)
    setRows(Array.isArray(data) ? data : [])
  }, [period])

  useEffect(() => {
    load()
  }, [load])

  const columns = [
    { key: 'rank', label: 'Rank', render: (r) => <RankBadge rank={r.rank} /> },
    {
      key: 'studentName',
      label: 'Student',
      render: (r) => (
        <span className={cn('font-medium', r.studentName === CURRENT_STUDENT && 'rounded-lg bg-violet-50 px-2 py-1 text-violet-800 ring-1 ring-violet-200')}>
          {r.studentName}
          {r.studentName === CURRENT_STUDENT && ' (You)'}
        </span>
      ),
    },
    { key: 'coinsEarned', label: 'Coins', render: (r) => formatCoins(r.coinsEarned) },
  ]

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageBanner icon={Trophy} title="Leaderboard" />
      <StudentPortalTabs />
      <LeaderboardTabs value={period} onChange={setPeriod} />
      <PaginatedFigmaTable columns={columns} data={rows} stickyHeader />
    </div>
  )
}
