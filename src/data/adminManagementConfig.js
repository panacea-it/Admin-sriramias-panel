import { BookOpen, Users, MessageCircle, Megaphone, Settings, Kanban, ClipboardList, Wallet, TrendingUp, Coins } from 'lucide-react'

export const PERMISSION_MODULES = [
  {
    id: 'academics',
    label: 'Academics',
    description: 'Courses, tests, live classes, and learning content.',
    icon: BookOpen,
  },
  {
    id: 'test_management',
    label: 'Test Management',
    description: 'CBT, OMR, question bank, evaluations, and test configuration.',
    icon: ClipboardList,
  },
  {
    id: 'users_access',
    label: 'User & Access',
    description: 'User accounts, roles, and admin access.',
    icon: Users,
  },
  {
    id: 'engagement_crm',
    label: 'CRM',
    description: 'Leads, enquiries, help desk, and notifications.',
    icon: MessageCircle,
  },
  {
    id: 'content_marketing',
    label: 'Marketing',
    description: 'Website, blogs, campaigns, and SEO content.',
    icon: Megaphone,
  },
  {
    id: 'finance_operation',
    label: 'Finance Operation',
    description: 'Payments, EMI, receipts, verification, and finance profiles.',
    icon: Wallet,
  },
  {
    id: 'sales_analysis',
    label: 'Sales & Analysis',
    description: 'Lead pipeline, conversion funnel, counselor performance, and reports.',
    icon: TrendingUp,
  },
  {
    id: 'bookstore_management',
    label: 'Bookstore Management',
    description: 'Products, inventory, orders, and bookstore analytics.',
    icon: BookOpen,
  },
  {
    id: 'wallet_rewards',
    label: 'Wallet & Rewards',
    description: 'Student wallets, reward rules, redemptions, and leaderboards.',
    icon: Coins,
  },
  {
    id: 'operations',
    label: 'Operations',
    description:
      'Internal workflows, reports, audits, operations tracking, and process management.',
    icon: Kanban,
  },
  {
    id: 'system_tools',
    label: 'System Tools',
    description: 'Integrations, logs, database, and platform settings.',
    icon: Settings,
  },
]

/** @deprecated Use AdminRolesProvider roles + legacyModuleMatrix instead. Kept for seeding defaults only. */
export const DEFAULT_PERMISSION_MATRIX = {
  super_admin: {
    academics: true,
    test_management: true,
    users_access: true,
    engagement_crm: true,
    content_marketing: true,
    finance_operation: true,
    sales_analysis: true,
    bookstore_management: true,
    wallet_rewards: true,
    operations: true,
    system_tools: true,
  },
  center_admin: {
    academics: true,
    users_access: true,
    engagement_crm: true,
    content_marketing: true,
    finance_operation: true,
    sales_analysis: true,
    operations: true,
    system_tools: true,
  },
  operation_admin: {
    academics: true,
    test_management: true,
    users_access: true,
    engagement_crm: false,
    content_marketing: false,
    finance_operation: false,
    sales_analysis: false,
    bookstore_management: false,
    wallet_rewards: false,
    operations: true,
    system_tools: false,
  },
  content_admin: {
    academics: true,
    users_access: false,
    engagement_crm: false,
    content_marketing: true,
    finance_operation: false,
    sales_analysis: false,
    bookstore_management: false,
    wallet_rewards: false,
    operations: false,
    system_tools: false,
  },
  mentor_admin: {
    academics: true,
    users_access: false,
    engagement_crm: true,
    content_marketing: false,
    finance_operation: false,
    sales_analysis: false,
    bookstore_management: false,
    wallet_rewards: false,
    operations: false,
    system_tools: false,
  },
  teacher_admin: {
    academics: true,
    test_management: true,
    users_access: false,
    engagement_crm: false,
    content_marketing: true,
    finance_operation: false,
    sales_analysis: false,
    bookstore_management: false,
    wallet_rewards: false,
    operations: false,
    system_tools: false,
  },
  counseling_admin: {
    academics: false,
    users_access: false,
    engagement_crm: true,
    content_marketing: false,
    finance_operation: false,
    sales_analysis: true,
    bookstore_management: false,
    wallet_rewards: false,
    operations: false,
    system_tools: false,
  },
}

export const CENTERS = [
  'All Centers',
  'Delhi Center',
  'Mumbai Center',
  'Bangalore Center',
  'Chennai Center',
  'Hyderabad Center',
]

/** Quick links from role overview module chips (Create User Access modal). */
export const ROLE_MODULE_ROUTES = {
  Sales: '/sales-analytics/leads',
  'Failed Payment List': '/sales-analytics/payment-failures',
  'Follow-ups': '/sales-analytics/follow-ups',
}

export const SESSION_TIMEOUTS = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: '120', label: '2 hours' },
  { value: '480', label: '8 hours' },
]

export const RECENT_ACTIVITY = [
  {
    id: 1,
    type: 'created',
    title: 'Admin created',
    description: 'Priya Sharma added as Center Admin — Delhi',
    user: 'PS',
    time: '12 min ago',
    status: 'success',
  },
  {
    id: 2,
    type: 'login',
    title: 'Login activity',
    description: 'Rajesh Verma signed in from Mumbai Center',
    user: 'RV',
    time: '34 min ago',
    status: 'info',
  },
  {
    id: 3,
    type: 'permission',
    title: 'Permissions updated',
    description: 'Mentor Admin role — CRM access enabled',
    user: 'SK',
    time: '1 hr ago',
    status: 'warning',
  },
  {
    id: 4,
    type: 'security',
    title: 'Security alert',
    description: '3 failed login attempts — amit.k@sriram.com',
    user: 'AK',
    time: '2 hr ago',
    status: 'danger',
  },
  {
    id: 5,
    type: 'created',
    title: 'Admin created',
    description: 'Neha Gupta added as Content Admin',
    user: 'NG',
    time: '4 hr ago',
    status: 'success',
  },
]

export const SECURITY_BADGES = {
  critical: { label: 'Critical', className: 'bg-rose-500/15 text-rose-700 ring-rose-500/20' },
  high: { label: 'High', className: 'bg-amber-500/15 text-amber-800 ring-amber-500/20' },
  medium: { label: 'Standard', className: 'bg-sky-500/15 text-sky-800 ring-sky-500/20' },
  low: { label: 'Low', className: 'bg-slate-500/15 text-slate-700 ring-slate-500/20' },
}
