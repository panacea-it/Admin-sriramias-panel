import { Video } from 'lucide-react'
import PageBanner from '../../../components/figma/PageBanner'
import LiveClassesPageShell from '../../../components/live-classes/LiveClassesPageShell'
import LiveClassesListSection from '../../../components/live-classes/LiveClassesListSection'

const BREADCRUMB = [
  { label: 'Academics' },
  { label: 'Live Classes' },
  { label: 'Recorded Classes' },
]

export default function RecordedClassesPage() {
  return (
    <LiveClassesPageShell
      breadcrumb={BREADCRUMB}
      banner={
        <PageBanner
          icon={Video}
          title="Recorded Classes"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
          iconClassName="text-[#246392]"
        />
      }
    >
      <LiveClassesListSection
        module="recordings"
        fixedLessonType="Recording"
        showLessonTypeFilter={false}
        emptyMessage="No recorded classes yet."
      />
    </LiveClassesPageShell>
  )
}
