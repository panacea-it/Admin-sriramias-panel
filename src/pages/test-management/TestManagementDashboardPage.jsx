import { LayoutDashboard, ClipboardList, Users, BookOpen, GraduationCap, Target, Clock } from 'lucide-react'
import TestManagementPageShell from '../../components/test-management/TestManagementPageShell'
import StatCard from '../../components/dashboard/StatCard'
import RecentTestActivitiesTable from '../../components/test-management/RecentTestActivitiesTable'
import {
  TM_DASHBOARD_STATS,
  TM_FACULTY_PERFORMANCE,
  TM_PARTICIPATION_TREND,
  TM_RECENT_ACTIVITIES,
  TM_TEST_TYPE_SPLIT,
} from '../../data/testManagementDashboardSeed'
import {
  FacultyBarChart,
  ParticipationAreaChart,
  TestTypePieChart,
} from '../../components/test-management/TestManagementDashboardCharts'
import TestManagementAnalyticsSection from '../../components/test-management/TestManagementAnalyticsSection'

export default function TestManagementDashboardPage() {
  const stats = TM_DASHBOARD_STATS

  return (
    <TestManagementPageShell icon={LayoutDashboard} title="Test Management Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total CBT Tests" value={stats.totalCbtTests} color="#55ace7" icon={ClipboardList} />
        <StatCard title="Total Mains Tests" value={stats.totalMainsTests} color="#1a3a5c" icon={BookOpen} />
        <StatCard title="Total Subjects" value={stats.totalSubjects} color="#10b981" icon={GraduationCap} />
        <StatCard title="Total Faculty" value={stats.totalFaculty} color="#8b5cf6" icon={Users} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Students Attempted" value={stats.studentsAttempted.toLocaleString()} color="#f59e0b" icon={Target} />
        <StatCard title="Avg Performance" value={`${stats.avgPerformancePct}%`} color="#06b6d4" icon={Target} />
        <StatCard title="Pending Evaluations" value={stats.pendingEvaluations} color="#ef4444" icon={Clock} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)] lg:col-span-2">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Student Participation</h3>
          <ParticipationAreaChart data={TM_PARTICIPATION_TREND} />
        </article>
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Test Type Split</h3>
          <TestTypePieChart data={TM_TEST_TYPE_SPLIT} />
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Faculty Performance</h3>
          <FacultyBarChart data={TM_FACULTY_PERFORMANCE} />
        </article>
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">Faculty Overview</h3>
          <ul className="space-y-3">
            {TM_FACULTY_PERFORMANCE.map((f) => (
              <li
                key={f.faculty}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-[#333]">{f.faculty}</p>
                  <p className="text-xs text-slate-500">{f.subject} · {f.tests} tests</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#55ace7]">{f.avgScore}%</p>
                  <p className="text-xs text-slate-500">{f.participation} students</p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <section className="w-full space-y-4">
        <h3 className="text-sm font-bold text-[#1a3a5c]">Recent Test Activities</h3>
        <RecentTestActivitiesTable data={TM_RECENT_ACTIVITIES} initialPageSize={10} />
      </section>

      <TestManagementAnalyticsSection />
    </TestManagementPageShell>
  )
}
