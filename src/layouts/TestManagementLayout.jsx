import { Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import RouteErrorBoundary from '../components/feedback/RouteErrorBoundary'
import NestedRouteRedirect from '../components/feedback/NestedRouteRedirect'
import OmrRouteGuard from '../components/test-management/omr/OmrRouteGuard'
import { TEST_MANAGEMENT_ROUTES } from '../constants/testManagementNav'
import { lazyRoute } from '../routes/lazyRoute'

const TestManagementDashboardPage = lazyRoute(
  () => import('../pages/test-management/TestManagementDashboardPage'),
  'Test Management dashboard',
)
const CbtManagementPage = lazyRoute(
  () => import('../pages/test-management/CbtManagementPage'),
  'CBT Management',
)
const CbtFacultyDetailPage = lazyRoute(
  () => import('../pages/test-management/CbtFacultyDetailPage'),
  'CBT faculty detail',
)
const CbtStudentResultsPage = lazyRoute(
  () => import('../pages/test-management/CbtStudentResultsPage'),
  'CBT student results',
)
const MainsManagementPage = lazyRoute(
  () => import('../pages/test-management/MainsManagementPage'),
  'Mains Management',
)
const MainsFacultyDetailPage = lazyRoute(
  () => import('../pages/test-management/MainsFacultyDetailPage'),
  'Mains faculty detail',
)
const MainsTopicDetailPage = lazyRoute(
  () => import('../pages/test-management/MainsTopicDetailPage'),
  'Mains topic detail',
)
const MainsEvaluationResultsPage = lazyRoute(
  () => import('../pages/test-management/MainsEvaluationResultsPage'),
  'Mains evaluation results',
)
const CbtTopicDetailPage = lazyRoute(
  () => import('../pages/test-management/CbtTopicDetailPage'),
  'CBT topic detail',
)
const QuestionManagementPage = lazyRoute(
  () => import('../pages/test-management/QuestionManagementPage'),
  'Question bank',
)
const EvaluationOversightPage = lazyRoute(
  () => import('../pages/test-management/EvaluationOversightPage'),
  'Evaluation oversight',
)
const EvaluationWorkspacePage = lazyRoute(
  () => import('../pages/test-management/EvaluationWorkspacePage'),
  'Evaluation workspace',
)
const EvaluatorAssignmentPage = lazyRoute(
  () => import('../pages/test-management/EvaluatorAssignmentPage'),
  'Evaluator assignment',
)
const TestManagementAnalyticsPage = lazyRoute(
  () => import('../pages/test-management/TestManagementAnalyticsPage'),
  'Test Management analytics',
)
const TestConfigurationLayout = lazyRoute(
  () => import('../pages/test-management/TestConfigurationLayout'),
  'Test Configuration layout',
)
const ExamPatternSectionPage = lazyRoute(
  () => import('../pages/test-management/test-configuration/ExamPatternSectionPage'),
  'Exam Pattern',
)
const SectionManagementSectionPage = lazyRoute(
  () => import('../pages/test-management/test-configuration/SectionManagementSectionPage'),
  'Section Management',
)
const MarkingRulesSectionPage = lazyRoute(
  () => import('../pages/test-management/test-configuration/MarkingRulesSectionPage'),
  'Marking Rules',
)
const LanguageSettingsSectionPage = lazyRoute(
  () => import('../pages/test-management/test-configuration/LanguageSettingsSectionPage'),
  'Language Settings',
)
const OmrManagementPage = lazyRoute(
  () => import('../pages/test-management/omr/index'),
  'OMR Management',
)
const CreateOmrExamPage = lazyRoute(
  () => import('../pages/test-management/omr/CreateOmrExamPage'),
  'Create OMR exam',
)
const EditOmrExamPage = lazyRoute(
  () => import('../pages/test-management/omr/EditOmrExamPage'),
  'Edit OMR exam',
)
const UploadOmrResultsPage = lazyRoute(
  () => import('../pages/test-management/omr/UploadOmrResultsPage'),
  'Upload OMR results',
)

function PageFallback() {
  return (
    <div className="flex min-h-[320px] items-center justify-center p-8">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
    </div>
  )
}

export default function TestManagementLayout() {
  const location = useLocation()

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl">
        <RouteErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TestManagementDashboardPage />} />
              <Route path="cbt" element={<CbtManagementPage />} />
              <Route path="cbt/faculty/:subjectId" element={<CbtFacultyDetailPage />} />
              <Route path="cbt/faculty/:subjectId/topic/:topicId" element={<CbtTopicDetailPage />} />
              <Route
                path="cbt/faculty/:subjectId/results/:testItemId"
                element={<CbtStudentResultsPage />}
              />
              <Route path="mains" element={<MainsManagementPage />} />
              <Route path="mains/faculty/:subjectId" element={<MainsFacultyDetailPage />} />
              <Route path="mains/faculty/:subjectId/topic/:topicId" element={<MainsTopicDetailPage />} />
              <Route
                path="mains/faculty/:subjectId/topic/:topicId/results/:testItemId"
                element={<MainsEvaluationResultsPage />}
              />
              <Route path="question-bank" element={<QuestionManagementPage />} />
              <Route path="test-configuration" element={<TestConfigurationLayout />}>
                <Route index element={<Navigate to="exam-pattern" replace />} />
                <Route path="exam-pattern" element={<ExamPatternSectionPage />} />
                <Route path="section-management" element={<SectionManagementSectionPage />} />
                <Route path="marking-rules" element={<MarkingRulesSectionPage />} />
                <Route path="language-settings" element={<LanguageSettingsSectionPage />} />
              </Route>
              <Route path="evaluations" element={<EvaluationOversightPage />} />
              <Route path="evaluations/assign" element={<EvaluatorAssignmentPage />} />
              <Route path="evaluations/workspace/:paperId" element={<EvaluationWorkspacePage />} />
              <Route path="analytics" element={<TestManagementAnalyticsPage />} />
              <Route
                path="omr"
                element={
                  <OmrRouteGuard>
                    <OmrManagementPage />
                  </OmrRouteGuard>
                }
              />
              <Route
                path="omr/create"
                element={
                  <OmrRouteGuard>
                    <CreateOmrExamPage />
                  </OmrRouteGuard>
                }
              />
              <Route
                path="omr/edit/:id"
                element={
                  <OmrRouteGuard>
                    <EditOmrExamPage />
                  </OmrRouteGuard>
                }
              />
              <Route
                path="omr/:id/upload-results"
                element={
                  <OmrRouteGuard>
                    <UploadOmrResultsPage />
                  </OmrRouteGuard>
                }
              />
              {/* Legacy routes → new structure (absolute paths for production deep links) */}
              <Route
                path="question-management"
                element={<Navigate to={TEST_MANAGEMENT_ROUTES.questionBank} replace />}
              />
              <Route path="test-integration" element={<Navigate to={TEST_MANAGEMENT_ROUTES.cbt} replace />} />
              <Route
                path="results-analytics"
                element={<Navigate to={TEST_MANAGEMENT_ROUTES.analytics} replace />}
              />
              <Route
                path="results-analytics-engine"
                element={<Navigate to={TEST_MANAGEMENT_ROUTES.analytics} replace />}
              />
              <Route
                path="evaluation-management"
                element={<Navigate to={TEST_MANAGEMENT_ROUTES.evaluations} replace />}
              />
              <Route
                path="evaluation-management/*"
                element={<Navigate to={TEST_MANAGEMENT_ROUTES.evaluations} replace />}
              />
              <Route path="*" element={<NestedRouteRedirect defaultSegment="dashboard" />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
      </section>
    </div>
  )
}
