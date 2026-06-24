import { LayoutDashboard, Route, Users, Filter, PieChart, UserCheck, CalendarClock, AlertCircle, FileSpreadsheet, Settings2 } from 'lucide-react'

export const SALES_ANALYTICS_BASE = '/sales-analytics'

export const SALES_ANALYTICS_ROUTES = {
  dashboard: `${SALES_ANALYTICS_BASE}/dashboard`,
  journey: `${SALES_ANALYTICS_BASE}/journey`,
  leads: `${SALES_ANALYTICS_BASE}/leads`,
  funnel: `${SALES_ANALYTICS_BASE}/funnel`,
  sources: `${SALES_ANALYTICS_BASE}/sources`,
  counselors: `${SALES_ANALYTICS_BASE}/counselors`,
  followUps: `${SALES_ANALYTICS_BASE}/follow-ups`,
  paymentFailures: `${SALES_ANALYTICS_BASE}/payment-failures`,
  reports: `${SALES_ANALYTICS_BASE}/reports`,
  configuration: `${SALES_ANALYTICS_BASE}/configuration`,
}

export const SALES_ANALYTICS_NAV_ITEMS = [
  { label: 'Lead Dashboard', path: SALES_ANALYTICS_ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'User Journey Tracking', path: SALES_ANALYTICS_ROUTES.journey, icon: Route },
  { label: 'Lead Management', path: SALES_ANALYTICS_ROUTES.leads, icon: Users },
  { label: 'Conversion Funnel', path: SALES_ANALYTICS_ROUTES.funnel, icon: Filter },
  { label: 'Source Analytics', path: SALES_ANALYTICS_ROUTES.sources, icon: PieChart },
  { label: 'Counselor Performance', path: SALES_ANALYTICS_ROUTES.counselors, icon: UserCheck },
  { label: 'Follow-up Manager', path: SALES_ANALYTICS_ROUTES.followUps, icon: CalendarClock },
  { label: 'Payment Failure Tracking', path: SALES_ANALYTICS_ROUTES.paymentFailures, icon: AlertCircle },
  { label: 'Reports & Exports', path: SALES_ANALYTICS_ROUTES.reports, icon: FileSpreadsheet },
  {
    label: 'Tracking Configuration',
    path: SALES_ANALYTICS_ROUTES.configuration,
    icon: Settings2,
    requiredRoles: ['super_admin'],
  },
]

export function isSalesAnalyticsPath(pathname) {
  return pathname === SALES_ANALYTICS_BASE || pathname.startsWith(`${SALES_ANALYTICS_BASE}/`)
}
