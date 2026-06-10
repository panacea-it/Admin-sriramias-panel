import { Monitor, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtMappingTable from '../../components/test-management/cbt/CbtMappingTable'
import EvaluationProgressCards from '../../components/test-management/EvaluationProgressCards'
import { useCbtTestSeriesHierarchy } from '../../hooks/useCbtTestSeriesHierarchy'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'

export default function CbtManagementPage() {
  const { mappingRows, latestEvaluations, loading, refresh } = useCbtTestSeriesHierarchy()

  const openEvaluation = (card, navigate) => {
    if (card.subjectId) {
      if (card.topicId) {
        navigate(TEST_MANAGEMENT_ROUTES.cbtTopic(card.subjectId, card.topicId))
      } else {
        navigate(TEST_MANAGEMENT_ROUTES.cbtFaculty(card.subjectId))
      }
    }
  }

  return (
    <TestManagementPageShell
      icon={Monitor}
      title="CBT Management"
      actions={
        <Link to="/academics/subjects">
          <BannerButton type="button">
            <Plus className="h-4 w-4" />
            Faculty Subjects
          </BannerButton>
        </Link>
      }
    >
      <EvaluationProgressCards
        cards={latestEvaluations}
        loading={loading}
        emptyMessage="No tests conducted yet."
        onCardClick={openEvaluation}
      />
      <CbtMappingTable rows={mappingRows} loading={loading} onRefresh={refresh} />
    </TestManagementPageShell>
  )
}
