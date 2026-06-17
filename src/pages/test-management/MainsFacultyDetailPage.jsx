import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ListChecks } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import MainsBreadcrumbNav from '../../components/test-management/mains/MainsBreadcrumbNav'
import MainsTopicsTable from '../../components/test-management/mains/MainsTopicsTable'
import StatCard from '../../components/dashboard/StatCard'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { useMainsFacultyTopics } from '../../hooks/useMainsFacultyTopics'
import { BookOpen, ClipboardList, FileText } from 'lucide-react'

export default function MainsFacultyDetailPage() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const { faculty, topics, loading } = useMainsFacultyTopics(subjectId)

  const breadcrumbs = faculty
    ? [{ key: 'faculty', label: `${faculty.subjectName} by ${faculty.facultyName}` }]
    : []

  if (!loading && !faculty) {
    return (
      <TestManagementPageShell icon={ListChecks} title="Faculty Subject">
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">Faculty subject not found or has no Mains tests.</p>
          <Link to={TEST_MANAGEMENT_ROUTES.mains} className="mt-4 inline-block">
            <BannerButton type="button">Back to Mains Management</BannerButton>
          </Link>
        </div>
      </TestManagementPageShell>
    )
  }

  return (
    <TestManagementPageShell
      icon={ListChecks}
      title={faculty ? `${faculty.subjectName} by ${faculty.facultyName}` : 'Faculty Subject'}
      actions={
        <BannerButton
          type="button"
          variant="secondary"
          showPlusIcon={false}
          onClick={() => navigate(TEST_MANAGEMENT_ROUTES.mains)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </BannerButton>
      }
    >
      <div className="mb-4">
        <MainsBreadcrumbNav items={breadcrumbs} />
      </div>

      {faculty && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <StatCard title="Topics" value={faculty.totalTopics} color="#1a3a5c" icon={BookOpen} />
            <StatCard title="Tests / PDFs" value={faculty.totalTests} color="#55ace7" icon={ClipboardList} />
            <StatCard title="Subject" value={faculty.subjectName} color="#10b981" icon={FileText} />
          </div>
          <MainsTopicsTable faculty={faculty} topics={topics} loading={loading} />
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
