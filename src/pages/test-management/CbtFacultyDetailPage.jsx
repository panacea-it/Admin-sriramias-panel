import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtBreadcrumbNav from '../../components/test-management/cbt/CbtBreadcrumbNav'
import CbtTopicsTable from '../../components/test-management/cbt/CbtTopicsTable'
import StatCard from '../../components/dashboard/StatCard'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { getCbtFacultyBySubjectId } from '../../utils/cbtTestSeriesHierarchy'
import { useCbtFacultySubject } from '../../hooks/useCbtFacultySubject'
import { useCbtFacultyTopics } from '../../hooks/useCbtFacultyTopics'
import { BookOpen, ClipboardList, Users, Loader2 } from 'lucide-react'

export default function CbtFacultyDetailPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { faculty, loading } = useCbtFacultySubject(subjectId)
  const { topics, loading: topicsLoading } = useCbtFacultyTopics(subjectId)

  const totalTests = topics.reduce((s, t) => s + (t.testCount ?? 0), 0)

  const breadcrumbs = faculty
    ? [
        {
          key: 'faculty',
          label: `${faculty.subjectName} — ${faculty.facultyName}`,
        },
      ]
    : []

  if (loading) {
    return (
      <TestManagementPageShell icon={Monitor} title="Faculty Test Series">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#55ace7]" />
        </div>
      </TestManagementPageShell>
    )
  }

  if (!faculty) {
    return (
      <TestManagementPageShell icon={Monitor} title="Faculty Test Series">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">Faculty mapping not found or has no TEST series.</p>
          <Link to={TEST_MANAGEMENT_ROUTES.cbt} className="mt-4 inline-block">
            <BannerButton type="button" showPlusIcon={false}>Back to CBT Management</BannerButton>
          </Link>
        </div>
      </TestManagementPageShell>
    )
  }

  return (
    <TestManagementPageShell
      icon={Monitor}
      title={`${faculty?.subjectName ?? 'Subject'} — ${faculty?.facultyName ?? 'Faculty'}`}
      actions={
        <BannerButton type="button" variant="secondary" showPlusIcon={false} onClick={() => navigate(TEST_MANAGEMENT_ROUTES.cbt)}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </BannerButton>
      }
    >
      <div className="mb-4">
        <CbtBreadcrumbNav items={breadcrumbs} />
      </div>

      {faculty && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <StatCard title="Topics" value={topics.length} color="#1a3a5c" icon={BookOpen} />
            <StatCard title="Test Series" value={totalTests} color="#55ace7" icon={ClipboardList} />
            <StatCard
              title="Students Attempted"
              value={faculty.studentsAttempted.toLocaleString()}
              color="#10b981"
              icon={Users}
            />
          </div>
          <p className="mb-3 text-xs text-slate-500">
            Select a topic to view tests and evaluation results.
          </p>
          <CbtTopicsTable faculty={faculty} topics={topics} loading={topicsLoading} />
        </>
      )}
    </TestManagementPageShell>
  )
}
