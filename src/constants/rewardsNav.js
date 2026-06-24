import { LayoutDashboard, ScrollText, Wallet, SlidersHorizontal, Gift, Trophy, Medal, ShieldAlert, FileSpreadsheet, Settings2, Coins, Users, Star, Link2 } from 'lucide-react'

export const REWARDS_ADMIN_BASE = '/admin/rewards'

export const REWARDS_ADMIN_ROUTES = {
  dashboard: `${REWARDS_ADMIN_BASE}/dashboard`,
  rules: `${REWARDS_ADMIN_BASE}/rules`,
  wallets: `${REWARDS_ADMIN_BASE}/wallets`,
  adjustments: `${REWARDS_ADMIN_BASE}/adjustments`,
  redemptions: `${REWARDS_ADMIN_BASE}/redemptions`,
  leaderboards: `${REWARDS_ADMIN_BASE}/leaderboards`,
  badges: `${REWARDS_ADMIN_BASE}/badges`,
  fraud: `${REWARDS_ADMIN_BASE}/fraud`,
  reports: `${REWARDS_ADMIN_BASE}/reports`,
  settings: `${REWARDS_ADMIN_BASE}/settings`,
}

export const REWARDS_ADMIN_NAV_ITEMS = [
  { label: 'Dashboard', path: REWARDS_ADMIN_ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'Reward Rules', path: REWARDS_ADMIN_ROUTES.rules, icon: ScrollText },
  { label: 'Student Wallets', path: REWARDS_ADMIN_ROUTES.wallets, icon: Wallet },
  { label: 'Manual Adjustments', path: REWARDS_ADMIN_ROUTES.adjustments, icon: SlidersHorizontal },
  { label: 'Redemptions', path: REWARDS_ADMIN_ROUTES.redemptions, icon: Gift },
  { label: 'Leaderboards', path: REWARDS_ADMIN_ROUTES.leaderboards, icon: Trophy },
  { label: 'Badges', path: REWARDS_ADMIN_ROUTES.badges, icon: Medal },
  { label: 'Fraud Monitoring', path: REWARDS_ADMIN_ROUTES.fraud, icon: ShieldAlert },
  { label: 'Reports', path: REWARDS_ADMIN_ROUTES.reports, icon: FileSpreadsheet },
  { label: 'Settings', path: REWARDS_ADMIN_ROUTES.settings, icon: Settings2 },
]

export const STUDENT_REWARDS_BASE = '/student'

export const STUDENT_REWARDS_ROUTES = {
  overview: `${STUDENT_REWARDS_BASE}/rewards`,
  wallet: `${STUDENT_REWARDS_BASE}/wallet`,
  redeem: `${STUDENT_REWARDS_BASE}/wallet/redeem`,
  leaderboard: `${STUDENT_REWARDS_BASE}/leaderboard`,
  achievements: `${STUDENT_REWARDS_BASE}/achievements`,
  referrals: `${STUDENT_REWARDS_BASE}/referrals`,
}

export const STUDENT_REWARDS_NAV_ITEMS = [
  { label: 'Rewards', path: STUDENT_REWARDS_ROUTES.overview, icon: Coins },
  { label: 'My Wallet', path: STUDENT_REWARDS_ROUTES.wallet, icon: Wallet },
  { label: 'Redeem', path: STUDENT_REWARDS_ROUTES.redeem, icon: Gift },
  { label: 'Leaderboard', path: STUDENT_REWARDS_ROUTES.leaderboard, icon: Trophy },
  { label: 'Achievements', path: STUDENT_REWARDS_ROUTES.achievements, icon: Star },
  { label: 'Referrals', path: STUDENT_REWARDS_ROUTES.referrals, icon: Link2 },
]

export function isRewardsAdminPath(pathname) {
  return pathname === REWARDS_ADMIN_BASE || pathname.startsWith(`${REWARDS_ADMIN_BASE}/`)
}

export function isStudentRewardsPath(pathname) {
  return pathname === STUDENT_REWARDS_BASE || pathname.startsWith(`${STUDENT_REWARDS_BASE}/`)
}
