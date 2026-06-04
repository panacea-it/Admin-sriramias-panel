import { Radio } from 'lucide-react'
import PageBanner from '../../../components/figma/PageBanner'
import LiveClassesPageShell from '../../../components/live-classes/LiveClassesPageShell'
import LiveClassesListSection from '../../../components/live-classes/LiveClassesListSection'
const BREADCRUMB = [
  { label: 'Academics' },
  { label: 'Live Classes' },
  { label: 'Schedule Class' },
]

export default function ScheduleClassPage() {
  return (
    <LiveClassesPageShell
      breadcrumb={BREADCRUMB}
      banner={
        <PageBanner
          icon={Radio}
          title="Schedule Class"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
          iconClassName="text-[#246392]"
        />
      }
    >
      <LiveClassesListSection
        module="schedule"
        emptyMessage="No classes scheduled yet. Click Add class to create your first lesson."
        showLessonTypeFilter
      />
    </LiveClassesPageShell>
  )
}
