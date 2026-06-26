import {
  TM_DASHBOARD_STATS,
  TM_FACULTY_PERFORMANCE,
  TM_PARTICIPATION_TREND,
  TM_RECENT_ACTIVITIES,
  TM_TEST_TYPE_SPLIT,
} from '../data/testManagementDashboardSeed'
import {
  TM_ACCURACY_HEATMAP,
  TM_STUDENT_RANKINGS,
  TM_SUBJECT_PERFORMANCE,
  TM_WEAK_AREAS,
} from '../data/testManagementAnalyticsSeed'

const DELAY_MS = 120

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchLiveTMData(_signal) {
  await delay()

  return {
    summary: {
      ...TM_DASHBOARD_STATS,
      avgPerformance: TM_DASHBOARD_STATS.avgPerformancePct,
      avgAttemptRate: 72.5,
    },
    studentParticipation: TM_PARTICIPATION_TREND,
    testTypeSplit: {
      cbt: TM_TEST_TYPE_SPLIT[0]?.value ?? 0,
      mains: TM_TEST_TYPE_SPLIT[1]?.value ?? 0,
    },
    recentActivities: TM_RECENT_ACTIVITIES.map((activity) => ({
      testName: activity.test,
      faculty: activity.faculty,
      activity: activity.action,
      timeAgo: activity.time,
      status: activity.status,
    })),
    facultyPerformance: TM_FACULTY_PERFORMANCE,
    facultyOverview: TM_FACULTY_PERFORMANCE.map((row) => ({
      facultyName: row.faculty,
      subject: row.subject,
      testsConducted: row.tests,
      avgPerformance: row.avgScore,
      studentsHandled: row.participation,
    })),
    subjectWisePerformance: TM_SUBJECT_PERFORMANCE,
    accuracyHeatmap: TM_ACCURACY_HEATMAP,
    topScorers: TM_STUDENT_RANKINGS,
    weakAreas: TM_WEAK_AREAS,
  }
}
