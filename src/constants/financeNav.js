import {
  LayoutDashboard,
  FileSpreadsheet,
  ShieldCheck,
  CalendarClock,
  Receipt,
  UserCircle,
  History,
  Banknote,
  MessageSquare,
  Settings2,
} from 'lucide-react'

export const FINANCE_BASE = '/finance'

export const FINANCE_ROUTES = {
  dashboard: `${FINANCE_BASE}/dashboard`,
  reports: `${FINANCE_BASE}/reports`,
  verification: `${FINANCE_BASE}/verification`,
  emi: `${FINANCE_BASE}/emi`,
  receipts: `${FINANCE_BASE}/receipts`,
  profiles: `${FINANCE_BASE}/profiles`,
  attempts: `${FINANCE_BASE}/attempts`,
  offlineApproval: `${FINANCE_BASE}/offline-approval`,
  communication: `${FINANCE_BASE}/communication`,
  gstSettings: `${FINANCE_BASE}/gst-settings`,
}

export const FINANCE_NAV_ITEMS = [
  { label: 'Payment Dashboard', path: FINANCE_ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'Student Payment Reports', path: FINANCE_ROUTES.reports, icon: FileSpreadsheet },
  { label: 'Payment Verification Center', path: FINANCE_ROUTES.verification, icon: ShieldCheck },
  { label: 'EMI Management', path: FINANCE_ROUTES.emi, icon: CalendarClock },
  { label: 'Receipt Management', path: FINANCE_ROUTES.receipts, icon: Receipt },
  { label: 'Student Finance Profiles', path: FINANCE_ROUTES.profiles, icon: UserCircle },
  { label: 'Payment Attempt Logs', path: FINANCE_ROUTES.attempts, icon: History },
  { label: 'Offline Payment Approval', path: FINANCE_ROUTES.offlineApproval, icon: Banknote },
  { label: 'Payment Communication Logs', path: FINANCE_ROUTES.communication, icon: MessageSquare },
  { label: 'GST & Invoice Settings', path: FINANCE_ROUTES.gstSettings, icon: Settings2 },
]

export function isFinancePath(pathname) {
  return pathname === FINANCE_BASE || pathname.startsWith(`${FINANCE_BASE}/`)
}
