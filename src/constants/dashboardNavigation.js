export const DASHBOARD_ROUTES = {
  centers: '/users/centers',
  users: '/users/manage',
  students: '/users/manage',
  staff: '/users/manage',
  courses: '/academics/categories/courses',
  revenue: '/finance/dashboard',
  financeReports: '/finance/reports',
  enquiries: '/enquiries',
  testDashboard: '/test-management/dashboard',
  testCbt: '/test-management/cbt',
  testMains: '/test-management/mains',
  analytics: '/analytics',
  teachers: '/academics/categories/teachers',
  batches: '/academics/batch',
  auditLogs: '/operations/audit-logs',
  receipts: '/finance/receipts',
  activityHistory: '/settings/activity-history',
}

export function dashboardSearchRoute(basePath, query) {
  const value = String(query || '').trim()
  if (!value) return basePath
  return `${basePath}?search=${encodeURIComponent(value)}`
}

export const dashboardStatRoutes = {
  'Total Centers': DASHBOARD_ROUTES.centers,
  'Total Students': DASHBOARD_ROUTES.students,
  'Total Staff': DASHBOARD_ROUTES.staff,
  'Active Courses': DASHBOARD_ROUTES.courses,
  'Total Revenue in Rs': DASHBOARD_ROUTES.revenue,
  'Total Enquiries': DASHBOARD_ROUTES.enquiries,
  'Success Rate': DASHBOARD_ROUTES.testDashboard,
  'Average Rating': DASHBOARD_ROUTES.analytics,
}

export const dashboardNavItemClass =
  'block w-full cursor-pointer rounded-xl text-left transition-all duration-200 hover:shadow-[0_8px_24px_rgba(36,99,146,0.12)] hover:ring-2 hover:ring-[#55ace7]/30 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7] focus-visible:ring-offset-2'
