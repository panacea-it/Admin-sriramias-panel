import {
  dashboardStats,
  centerPerformance,
  popularCourses,
  revenueTrends,
} from '../data/dashboardData'

/** Download dashboard summary as CSV for header export action */
export function downloadDashboardSummary() {
  const lines = [
    'Section,Metric,Value',
    ...dashboardStats.map((s) => `Stats,${s.title},${s.value}`),
    ...centerPerformance.map((c) => `Centers,${c.name},${c.students} students`),
    ...popularCourses.map((c) => `Courses,${c.name},${c.enrolled} enrolled`),
    ...revenueTrends.map((r) => `Revenue,${r.month},${r.total}`),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `dashboard-summary-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
