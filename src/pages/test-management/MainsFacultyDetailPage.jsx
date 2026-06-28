import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ListChecks } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import MainsBreadcrumbNav from '../../components/test-management/mains/MainsBreadcrumbNav'
import MainsTopicsTable from '../../components/test-management/mains/MainsTopicsTable'
import StatCard from '../../components/dashboard/StatCard'
import { BannerButton } from '../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../constants/testManagementNav'
import { useMainsFacultySubject } from '../../hooks/useMainsManagement'
import { mmSession } from '../../utils/mmSessionStorage'
import { toast } from '../../utils/toast'
import { getApiErrorMessage } from '../../utils/apiError'
import { BookOpen, ClipboardList, FileText, Loader2 } from 'lucide-react'

export default function MainsFacultyDetailPage() {
  const { subjectId } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const facultySubjectId =
    state?.facultySubjectId || mmSession.get('facultySubjectId') || subjectId

  const { data, isLoading, error } = useMainsFacultySubject(facultySubjectId)

  useEffect(() => {
    if (!facultySubjectId) {
      toast.error('Faculty Subject not found')
      navigate(TEST_MANAGEMENT_ROUTES.mains, { replace: true })
    }
  }, [facultySubjectId, navigate])

  useEffect(() => {
    if (error) {
      console.error('[MainsManagement]', error)
      toast.error(getApiErrorMessage(error, 'Failed to load faculty subject'))
    }
  }, [error])

  const faculty = data?.faculty ?? null
  const topics = data?.topics ?? []
  const loading = isLoading

  const breadcrumbs = faculty
    ? [
        {
          key: 'faculty',
          label:
            faculty.facultySubjectName ||
            `${faculty.subjectName} by ${faculty.facultyName}`,
        },
      ]
    : []

  if (loading) {
    return (
      <TestManagementPageShell icon={ListChecks} title="Faculty Subject">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#55ace7]" />
        </div>
      </TestManagementPageShell>
    )
  }

  if (!faculty) {
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

  const pageTitle =
    faculty.facultySubjectName || `${faculty.subjectName} by ${faculty.facultyName}`

  return (
    <TestManagementPageShell
      icon={ListChecks}
      title={pageTitle}
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

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <StatCard title="Topics" value={faculty.totalTopics} color="#1a3a5c" icon={BookOpen} />
        <StatCard title="Tests / PDFs" value={faculty.totalTests} color="#55ace7" icon={ClipboardList} />
        <StatCard
          title="Subject"
          value={faculty.subjectLabel || faculty.subjectName}
          color="#10b981"
          icon={FileText}
        />
      </div>
      <MainsTopicsTable faculty={faculty} topics={topics} loading={loading} />
    </TestManagementPageShell>
  )
}
