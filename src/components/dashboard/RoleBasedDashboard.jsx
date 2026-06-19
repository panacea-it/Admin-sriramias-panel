import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, Bell, BookMarked, Building2, IndianRupee, Star, Trophy, Users } from 'lucide-react'
import DashboardHero from './DashboardHero'
import DashboardStatCard from './DashboardStatCard'
import DashboardAccordionSection from './DashboardAccordionSection'
import DashboardAccordionToolbar from './DashboardAccordionToolbar'
import CenterPerformanceSection from './CenterPerformanceSection'
import PopularCoursesSection from './PopularCoursesSection'
import RevenueTrendsSection from './RevenueTrendsSection'
import RecentActivitiesSection from './RecentActivitiesSection'
import TopFacultySection from './TopFacultySection'
import DemographicsSection from './DemographicsSection'
import ExamSuccessSection from './ExamSuccessSection'
import { DASHBOARD_SECTIONS } from '../../config/rbacAccess'
import { usePermissions } from '../../hooks/usePermissions'
import { DASHBOARD_ROUTES } from '../../constants/dashboardNavigation'
import {
  dashboardStats,
  centerPerformance,
  popularCourses,
  revenueTrends,
  activities,
  topFaculty,
  demographics,
  examSuccess,
} from '../../data/dashboardData'

const ACCORDION_PANEL_KEYS = [
  DASHBOARD_SECTIONS.stats,
  DASHBOARD_SECTIONS.centerPerformance,
  DASHBOARD_SECTIONS.popularCourses,
  DASHBOARD_SECTIONS.revenue,
  DASHBOARD_SECTIONS.activities,
  DASHBOARD_SECTIONS.faculty,
  DASHBOARD_SECTIONS.demographics,
  DASHBOARD_SECTIONS.examSuccess,
]

const viewAllLinkClass =
  'cursor-pointer text-xs font-bold text-[#2286c3] transition hover:underline active:scale-95'

function ViewAllLink({ to }) {
  return (
    <Link to={to} className={viewAllLinkClass} onClick={(e) => e.stopPropagation()}>
      View All
    </Link>
  )
}

export default function RoleBasedDashboard() {
  const { dashboardSections } = usePermissions()
  const show = useCallback((key) => dashboardSections.includes(key), [dashboardSections])

  const visibleAccordionKeys = useMemo(
    () => ACCORDION_PANEL_KEYS.filter((key) => show(key)),
    [show],
  )

  const [openSections, setOpenSections] = useState(() => new Set())

  const isOpen = (key) => openSections.has(key)

  const toggleSection = (key) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const expandAll = () => setOpenSections(new Set(visibleAccordionKeys))
  const collapseAll = () => setOpenSections(new Set())

  const hasAccordionPanels = visibleAccordionKeys.length > 0

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-5 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-screen-xl space-y-5 sm:space-y-6">
        {show(DASHBOARD_SECTIONS.hero) && <DashboardHero />}

        {hasAccordionPanels && (
          <DashboardAccordionToolbar onExpandAll={expandAll} onCollapseAll={collapseAll} />
        )}

        {show(DASHBOARD_SECTIONS.stats) && (
          <DashboardAccordionSection
            icon={BarChart3}
            title="Dashboard Summary"
            isOpen={isOpen(DASHBOARD_SECTIONS.stats)}
            onToggle={() => toggleSection(DASHBOARD_SECTIONS.stats)}
          >
            <section className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {dashboardStats.map((item) => (
                <DashboardStatCard key={item.title} {...item} />
              ))}
            </section>
          </DashboardAccordionSection>
        )}

        {show(DASHBOARD_SECTIONS.centerPerformance) && (
          <DashboardAccordionSection
            icon={Building2}
            title="Center Performance Dashboard"
            isOpen={isOpen(DASHBOARD_SECTIONS.centerPerformance)}
            onToggle={() => toggleSection(DASHBOARD_SECTIONS.centerPerformance)}
          >
            <CenterPerformanceSection centers={centerPerformance} embedded />
          </DashboardAccordionSection>
        )}

        {(show(DASHBOARD_SECTIONS.popularCourses) || show(DASHBOARD_SECTIONS.revenue)) && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            {show(DASHBOARD_SECTIONS.popularCourses) && (
              <DashboardAccordionSection
                icon={BookMarked}
                title="Popular Courses"
                isOpen={isOpen(DASHBOARD_SECTIONS.popularCourses)}
                onToggle={() => toggleSection(DASHBOARD_SECTIONS.popularCourses)}
                action={<ViewAllLink to={DASHBOARD_ROUTES.courses} />}
              >
                <PopularCoursesSection courses={popularCourses} embedded />
              </DashboardAccordionSection>
            )}
            {show(DASHBOARD_SECTIONS.revenue) && (
              <DashboardAccordionSection
                icon={IndianRupee}
                title="Revenue Trends"
                isOpen={isOpen(DASHBOARD_SECTIONS.revenue)}
                onToggle={() => toggleSection(DASHBOARD_SECTIONS.revenue)}
                action={<ViewAllLink to={DASHBOARD_ROUTES.financeReports} />}
              >
                <RevenueTrendsSection trends={revenueTrends} embedded />
              </DashboardAccordionSection>
            )}
          </div>
        )}

        {show(DASHBOARD_SECTIONS.activities) && (
          <DashboardAccordionSection
            icon={Bell}
            title="Recent Activities & Alerts"
            isOpen={isOpen(DASHBOARD_SECTIONS.activities)}
            onToggle={() => toggleSection(DASHBOARD_SECTIONS.activities)}
            action={<ViewAllLink to={DASHBOARD_ROUTES.auditLogs} />}
          >
            <RecentActivitiesSection activities={activities} embedded />
          </DashboardAccordionSection>
        )}

        {(show(DASHBOARD_SECTIONS.faculty) ||
          show(DASHBOARD_SECTIONS.demographics) ||
          show(DASHBOARD_SECTIONS.examSuccess)) && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            {show(DASHBOARD_SECTIONS.faculty) && (
              <DashboardAccordionSection
                icon={Trophy}
                title="Top Faculty"
                isOpen={isOpen(DASHBOARD_SECTIONS.faculty)}
                onToggle={() => toggleSection(DASHBOARD_SECTIONS.faculty)}
              >
                <TopFacultySection faculty={topFaculty} embedded />
              </DashboardAccordionSection>
            )}
            <div className="space-y-5 sm:space-y-6">
              {show(DASHBOARD_SECTIONS.demographics) && (
                <DashboardAccordionSection
                  icon={Users}
                  title="Student Demographics"
                  isOpen={isOpen(DASHBOARD_SECTIONS.demographics)}
                  onToggle={() => toggleSection(DASHBOARD_SECTIONS.demographics)}
                >
                  <DemographicsSection demographics={demographics} embedded />
                </DashboardAccordionSection>
              )}
              {show(DASHBOARD_SECTIONS.examSuccess) && (
                <DashboardAccordionSection
                  icon={Star}
                  title="Exam Success Rate"
                  isOpen={isOpen(DASHBOARD_SECTIONS.examSuccess)}
                  onToggle={() => toggleSection(DASHBOARD_SECTIONS.examSuccess)}
                >
                  <ExamSuccessSection exams={examSuccess} embedded />
                </DashboardAccordionSection>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
