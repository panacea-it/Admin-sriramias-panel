import { useCallback, useEffect, useState } from 'react'
import { Award, Lock } from 'lucide-react'
import PageBanner from '../../../components/figma/PageBanner'
import StudentPortalTabs from '../../../components/rewards/StudentPortalTabs'
import { getStudentBadges } from '../../../services/rewardService'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { cn } from '../../../utils/cn'

export default function StudentAchievementsPage() {
  const [badges, setBadges] = useState([])

  useEffect(() => {
    getStudentBadges().then((data) => setBadges(Array.isArray(data) ? data : []))
  }, [])

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-6">
      <PageBanner icon={Award} title="Achievements" />
      <StudentPortalTabs />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {badges.map((badge) => (
          <article
            key={badge.id}
            className={cn(
              'rounded-xl border bg-white p-5 shadow-md',
              !badge.unlocked && 'opacity-60 grayscale',
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef2fc]">
              {badge.unlocked ? <Award className="h-6 w-6 text-[#246392]" /> : <Lock className="h-6 w-6 text-slate-400" />}
            </div>
            <h3 className="mt-3 font-bold text-slate-900">{badge.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{badge.description}</p>
            {badge.unlocked && badge.unlockDate && (
              <p className="mt-2 text-xs font-medium text-emerald-700">
                Unlocked {formatCategoryDateTime(badge.unlockDate)}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
