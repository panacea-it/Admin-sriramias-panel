import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Monitor } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import CbtBreadcrumbNav from '../../components/test-management/cbt/CbtBreadcrumbNav'
import CbtTopicsTable from '../../components/test-management/cbt/CbtTopicsTable'
import StatCard from '../../components/dashboard/StatCard'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { getCbtFacultyBySubjectId, getCbtTopics } from '../../utils/cbtTestSeriesHierarchy'
import { useCbtTestSeriesHierarchy } from '../../hooks/useCbtTestSeriesHierarchy'
import { BookOpen, ClipboardList, Users } from 'lucide-react'

export default function CbtFacultyDetailPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { mappingRows, loading } = useCbtTestSeriesHierarchy()

  const faculty = useMemo(() => {
    const fromRows = mappingRows.find((r) => String(r.subjectId) === String(subjectId))
    if (fromRows) return fromRows
    return getCbtFacultyBySubjectId(subjectId)
  }, [mappingRows, subjectId])

  const topics = useMemo(() => getCbtTopics(faculty), [faculty])
  const totalTests = topics.reduce((s, t) => s + t.testCount, 0)

  const breadcrumbs = faculty
    ? [
        {
          key: 'faculty',
          label: `${faculty.subjectName} — ${faculty.facultyName}`,
        },
      ]
    : []

  if (!loading && !faculty) {
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
          <CbtTopicsTable faculty={faculty} loading={loading} />
        </>
      )}

      {loading && !faculty && (
        <div className="flex min-h-[200px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
        </div>
      )}
    </TestManagementPageShell>
  )
}
