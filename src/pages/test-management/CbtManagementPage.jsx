import { Monitor } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtMappingTable from '../../components/test-management/cbt/CbtMappingTable'
import { CbtLatestTestSeries } from '../../components/test-management/cbt/ui'
import { useCbtTestSeriesHierarchy } from '../../hooks/useCbtTestSeriesHierarchy'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'

export default function CbtManagementPage() {
  const navigate = useNavigate()
  const { mappingRows, latestEvaluations, loading } = useCbtTestSeriesHierarchy()

  const openFacultyFromCard = (card) => {
    if (card.subjectId) {
      navigate(TEST_MANAGEMENT_ROUTES.cbtFaculty(card.subjectId))
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
      <CbtLatestTestSeries
        className="mb-4 sm:mb-5"
        cards={latestEvaluations}
        loading={loading}
        emptyMessage="No tests conducted yet."
        heading="Latest Test Series"
        showUploadedSheets={false}
        resultsLineLabel="published"
        onCardClick={openFacultyFromCard}
      />
      <CbtMappingTable rows={mappingRows} loading={loading} />
    </TestManagementPageShell>
  )
}
