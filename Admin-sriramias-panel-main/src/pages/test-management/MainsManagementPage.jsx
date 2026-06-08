import { ListChecks } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import EvaluationProgressCards from '../../components/test-management/EvaluationProgressCards'
import MainsFacultySubjectsTable from '../../components/test-management/mains/MainsFacultySubjectsTable'
import { useMainsEvaluationHierarchy } from '../../hooks/useMainsEvaluationHierarchy'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'

export default function MainsManagementPage() {
  const { facultyRows, latestEvaluations, loading, refresh } = useMainsEvaluationHierarchy()

  const openEvaluation = (card, navigate) => {
    if (card.subjectId && card.topicId) {
      navigate(TEST_MANAGEMENT_ROUTES.mainsResults(card.subjectId, card.topicId, card.id))
    }
  }

  return (
    <TestManagementPageShell icon={ListChecks} title="Mains Management">
      <EvaluationProgressCards
        cards={latestEvaluations}
        loading={loading}
        emptyMessage="No evaluations completed yet."
        onCardClick={openEvaluation}
      />
      <MainsFacultySubjectsTable rows={facultyRows} loading={loading} onRefresh={refresh} />
    </TestManagementPageShell>
  )
}
