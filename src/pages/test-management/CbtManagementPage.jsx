import { Monitor } from 'lucide-react'
import { Link } from 'react-router-dom'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtMappingTable from '../../components/test-management/cbt/CbtMappingTable'
import EvaluationProgressCards from '../../components/test-management/EvaluationProgressCards'
import { useCbtTestSeriesHierarchy } from '../../hooks/useCbtTestSeriesHierarchy'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'

export default function CbtManagementPage() {
  const { mappingRows, latestEvaluations, loading } = useCbtTestSeriesHierarchy()

  const openResults = (card, navigate) => {
    if (card.subjectId && card.id) {
      navigate(TEST_MANAGEMENT_ROUTES.cbtResults(card.subjectId, card.id))
    }
  }

  return (
    <TestManagementPageShell
      icon={Monitor}
      title="CBT Management"
      actions={
        <Link to="/academics/subjects">
          <BannerButton type="button" showPlusIcon={false}>
            Faculty Subjects
          </BannerButton>
        </Link>
      }
    >
      <EvaluationProgressCards
        cards={latestEvaluations}
        loading={loading}
        emptyMessage="No tests conducted yet."
        heading="Latest Test Series"
        showUploadedSheets={false}
        resultsLineLabel="published"
        onCardClick={openResults}
      />
      <CbtMappingTable rows={mappingRows} loading={loading} />
    </TestManagementPageShell>
  )
}
