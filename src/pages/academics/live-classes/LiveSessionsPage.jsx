import { Radio } from 'lucide-react'
import PageBanner from '../../../components/figma/PageBanner'
import LiveClassesPageShell from '../../../components/live-classes/LiveClassesPageShell'
import LiveClassesListSection from '../../../components/live-classes/LiveClassesListSection'

const BREADCRUMB = [
  { label: 'Academics' },
  { label: 'Live Classes' },
  { label: 'Live Sessions' },
]

export default function LiveSessionsPage() {
  return (
    <LiveClassesPageShell
      breadcrumb={BREADCRUMB}
      banner={
        <PageBanner
          icon={Radio}
          title="Live Sessions"
          iconClassName="text-[#246392]"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        />
      }
    >
      <LiveClassesListSection
        module="liveSessions"
        fixedLessonType="Live"
        showLessonTypeFilter={false}
        emptyMessage="No live sessions scheduled."
      />
    </LiveClassesPageShell>
  )
}
