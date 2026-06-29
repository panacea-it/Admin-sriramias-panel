import { LayoutDashboard, ClipboardList, Users, BookOpen, GraduationCap, Target, Clock, Loader2 } from 'lucide-react';
import TestManagementPageShell from "../../components/test-management/TestManagementPageShell";
import StatCard from "../../components/dashboard/StatCard";
import RecentTestActivitiesTable from "../../components/test-management/RecentTestActivitiesTable";
import {
  FacultyBarChart,
  ParticipationAreaChart,
  TestTypePieChart,
} from "../../components/test-management/TestManagementDashboardCharts";
import TestManagementAnalyticsSection from "../../components/test-management/TestManagementAnalyticsSection";
import { useTestManagementDashboard } from "../../hooks/useTestManagementDashboard";
import {
  asArray,
  formatNumber,
  formatPercent,
  normalizeDashboardAnalytics,
  normalizeFacultyOverview,
  normalizeRecentActivities,
} from "../../utils/testManagementDashboardHelpers";

export default function TestManagementDashboardPage() {
  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useTestManagementDashboard();

  const showInitialLoading = isLoading && !data;

  if (showInitialLoading) {
    return (
      <TestManagementPageShell
        icon={LayoutDashboard}
        title="Test Management Dashboard"
      >
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#55ace7]" />
        </div>
      </TestManagementPageShell>
    );
  }

  if (isError && !data) {
    return (
      <TestManagementPageShell
        icon={LayoutDashboard}
        title="Test Management Dashboard"
      >
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-sm text-slate-600">
            Dashboard data is unavailable.
          </p>
          <button
            type="button"
            className="rounded-lg bg-[#55ace7] px-4 py-2 text-sm font-semibold text-white"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Retrying…" : "Retry"}
          </button>
        </div>
      </TestManagementPageShell>
    );
  }

  const stats = data?.summary ?? {};
  const participation = asArray(data?.studentParticipation);
  const facultyPerformance = asArray(data?.facultyPerformance);
  const facultyOverview = normalizeFacultyOverview(data?.facultyOverview);
  const testTypeSplit = [
    { name: "CBT", value: data?.testTypeSplit?.cbt ?? 0 },
    { name: "Mains", value: data?.testTypeSplit?.mains ?? 0 },
  ];
  const recentActivities = normalizeRecentActivities(data?.recentActivities);
  const analyticsData = normalizeDashboardAnalytics({
    summary: stats,
    subjectWisePerformance: data?.subjectWisePerformance,
    accuracyHeatmap: data?.accuracyHeatmap,
    topScorers: data?.topScorers,
    weakAreas: data?.weakAreas,
  });

  const studentsAttempted = formatNumber(stats.studentsAttempted);
  const studentsAttemptedDisplay =
    studentsAttempted === "—"
      ? studentsAttempted
      : Number(studentsAttempted).toLocaleString();

  return (
    <TestManagementPageShell
      icon={LayoutDashboard}
      title="Test Management Dashboard"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total CBT Tests"
          value={formatNumber(stats.totalCbtTests)}
          color="#55ace7"
          icon={ClipboardList}
        />
        <StatCard
          title="Total Mains Tests"
          value={formatNumber(stats.totalMainsTests)}
          color="#1a3a5c"
          icon={BookOpen}
        />
        <StatCard
          title="Total Subjects"
          value={formatNumber(stats.totalSubjects)}
          color="#10b981"
          icon={GraduationCap}
        />
        <StatCard
          title="Total Faculty"
          value={formatNumber(stats.totalFaculty)}
          color="#8b5cf6"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Students Attempted"
          value={studentsAttemptedDisplay}
          color="#f59e0b"
          icon={Target}
        />
        <StatCard
          title="Avg Performance"
          value={formatPercent(stats.avgPerformance)}
          color="#06b6d4"
          icon={Target}
        />
        <StatCard
          title="Avg Attempt Rate"
          value={formatPercent(stats.avgAttemptRate)}
          color="#8b5cf6"
          icon={Target}
        />
        <StatCard
          title="Pending Evaluations"
          value={formatNumber(stats.pendingEvaluations)}
          color="#ef4444"
          icon={Clock}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)] lg:col-span-2">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">
            Student Participation
          </h3>
          <ParticipationAreaChart data={participation} />
        </article>
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">
            Test Type Split
          </h3>
          <TestTypePieChart data={testTypeSplit} />
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">
            Faculty Performance
          </h3>
          <FacultyBarChart data={facultyPerformance} />
        </article>
        <article className="rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--card-shadow)]">
          <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">
            Faculty Overview
          </h3>
          <ul className="space-y-3">
            {facultyOverview.map((f, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-[#333]">{f.facultyName}</p>
                  <p className="text-xs text-slate-500">
                    {f.subject} · {f.testsConducted} tests
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#55ace7]">
                    {formatPercent(f.avgPerformance)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {f.studentsHandled} students
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>

      <section className="w-full space-y-4">
        <h3 className="text-sm font-bold text-[#1a3a5c]">
          Recent Test Activities
        </h3>
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <RecentTestActivitiesTable
            data={recentActivities}
            initialPageSize={10}
            emptyMessage="No Activities Found"
          />
        </div>
      </section>

      <TestManagementAnalyticsSection analyticsData={analyticsData} />
    </TestManagementPageShell>
  );
}
