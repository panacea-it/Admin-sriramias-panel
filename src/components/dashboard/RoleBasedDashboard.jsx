import DashboardHero from './DashboardHero'
import DashboardStatCard from './DashboardStatCard'
import CenterPerformanceSection from './CenterPerformanceSection'
import PopularCoursesSection from './PopularCoursesSection'
import RevenueTrendsSection from './RevenueTrendsSection'
import RecentActivitiesSection from './RecentActivitiesSection'
import TopFacultySection from './TopFacultySection'
import DemographicsSection from './DemographicsSection'
import ExamSuccessSection from './ExamSuccessSection'
import { DASHBOARD_SECTIONS } from '../../config/rbacAccess'
import { usePermissions } from '../../hooks/usePermissions'
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

export default function RoleBasedDashboard() {
  const { dashboardSections } = usePermissions()
  const show = (key) => dashboardSections.includes(key)

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-5 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-screen-xl space-y-5 sm:space-y-6">
        {show(DASHBOARD_SECTIONS.hero) && <DashboardHero />}

        {show(DASHBOARD_SECTIONS.stats) && (
          <section className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            {dashboardStats.map((item) => (
              <DashboardStatCard key={item.title} {...item} />
            ))}
          </section>
        )}

        {show(DASHBOARD_SECTIONS.centerPerformance) && (
          <CenterPerformanceSection centers={centerPerformance} />
        )}

        {(show(DASHBOARD_SECTIONS.popularCourses) || show(DASHBOARD_SECTIONS.revenue)) && (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            {show(DASHBOARD_SECTIONS.popularCourses) && (
              <PopularCoursesSection courses={popularCourses} />
            )}
            {show(DASHBOARD_SECTIONS.revenue) && (
              <RevenueTrendsSection trends={revenueTrends} />
            )}
          </section>
        )}

        {show(DASHBOARD_SECTIONS.activities) && (
          <RecentActivitiesSection activities={activities} />
        )}

        {(show(DASHBOARD_SECTIONS.faculty) ||
          show(DASHBOARD_SECTIONS.demographics) ||
          show(DASHBOARD_SECTIONS.examSuccess)) && (
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
            {show(DASHBOARD_SECTIONS.faculty) && <TopFacultySection faculty={topFaculty} />}
            <div className="space-y-5 sm:space-y-6">
              {show(DASHBOARD_SECTIONS.demographics) && (
                <DemographicsSection demographics={demographics} />
              )}
              {show(DASHBOARD_SECTIONS.examSuccess) && (
                <ExamSuccessSection exams={examSuccess} />
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
