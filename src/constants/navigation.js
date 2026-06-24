import { LayoutDashboard, Bookmark, Layers, Globe2, LibraryBig, TicketPercent, Settings, BookOpen, GraduationCap, FolderOpen, Gift, ClipboardList, Newspaper, Users, Wallet, Shield, UserPlus, MessageCircle, Headphones, BellRing, FileSearch, FileText, Tv, BarChart2, SlidersHorizontal, ScrollText, Database, Plug, ListOrdered, Building2, IdCard, LayoutGrid, TrendingUp, Layers3, Coins, BookOpenCheck } from 'lucide-react'
import { ACADEMICS_LIVE_CLASSES_SUBMENU } from './liveClassesNav'
import { ACADEMICS_CONTENT_LIBRARY_SUBMENU } from './contentLibraryNav'
import { FINANCE_NAV_ITEMS } from './financeNav'
import { SALES_ANALYTICS_NAV_ITEMS } from './salesAnalyticsNav'
import { BOOKSTORE_NAV_ITEMS } from './bookstoreNav'
import { TEST_MANAGEMENT_NAV_ITEMS } from './testManagementNav'
import { REWARDS_ADMIN_NAV_ITEMS, STUDENT_REWARDS_ROUTES } from './rewardsNav'

/** Top-level dashboard link (no children) */
export const SIDEBAR_DASHBOARD = {
  id: 'dashboard',
  label: 'Dashboard',
  path: '/dashboard',
  icon: LayoutDashboard,
}

/** Nested Categories submenu — academic hierarchy */
export const ACADEMICS_CATEGORIES_SUBMENU = {
  id: 'academics-categories',
  label: 'Categories',
  children: [
    { label: 'Programs', path: '/academics/categories/programs', icon: LayoutGrid },
    { label: 'Exam Category', path: '/academics/categories/exam-category', icon: LayoutGrid },
    { label: 'Exam Sub Category', path: '/academics/categories/exam-sub-category', icon: LayoutGrid },
    { label: 'Courses', path: '/academics/categories/courses', icon: BookOpen },
    { label: 'Subject', path: '/academics/categories/subject', icon: GraduationCap },
    { label: 'Topic', path: '/academics/categories/topic', icon: Layers },
    { label: 'Faculty', path: '/academics/categories/faculty', icon: Users },
    { label: 'City', path: '/academics/categories/city', icon: LayoutGrid },
    { label: 'Class Rooms', path: '/academics/categories/class-rooms', icon: LayoutGrid },
  ],
}

/** Collapsible sidebar groups — matches Figma accordion nav */
export const SIDEBAR_GROUPS = [
  {
    id: 'academics',
    label: 'Academics',
    icon: Bookmark,
    children: [
      { label: 'Batch', path: '/academics/batch', icon: BookOpen },
      { label: 'Faculty Subjects', path: '/academics/subjects', icon: Layers3 },
      ACADEMICS_LIVE_CLASSES_SUBMENU,
      ACADEMICS_CONTENT_LIBRARY_SUBMENU,
      { label: 'Free Resources', path: '/free-resources', icon: Gift },
      { label: 'Current Affairs', path: '/current-affairs', icon: Newspaper },
      ACADEMICS_CATEGORIES_SUBMENU,
    ],
  },
  {
    id: 'test-management',
    label: 'Test Management',
    icon: ClipboardList,
    children: TEST_MANAGEMENT_NAV_ITEMS.map((item) =>
      item.children ? item : { label: item.label, path: item.path, icon: item.icon },
    ),
  },
  {
    id: 'admin-management',
    label: 'Admin Management',
    icon: Shield,
    children: [
      { label: 'Admin Management', path: '/users/admin', icon: Shield, requiredRoles: ['super_admin'] },
      { label: 'Role Access', path: '/users/admin-access-types', icon: IdCard },
      { label: 'Admin Access', path: '/users/role-matrix', icon: LayoutGrid },
      {
        label: 'Centre Management',
        path: '/users/centers',
        icon: Building2,
        requiredRoles: ['super_admin', 'center_admin'],
      },
    ],
  },
  {
    id: 'users',
    label: 'Users & Access',
    icon: Layers,
    children: [
      { label: 'List Users', path: '/users/manage', icon: Users },
      { label: 'Coupons', path: '/coupons', icon: TicketPercent },
    ],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Globe2,
    children: [
      { label: 'Leads', path: '/crm/leads', icon: UserPlus },
      { label: 'Enquiries', path: '/enquiries', icon: MessageCircle },
      { label: 'Help Desk', path: '/crm/help-desk', icon: Headphones },
      { label: 'Push Notifications', path: '/crm/push-notifications', icon: BellRing },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: LibraryBig,
    children: [
      {
        id: 'home-page-management',
        label: 'Home Page Management',
        children: [
          { label: 'Youtube Management', path: '/marketing/website', icon: Tv },
          { label: 'Rank Management', path: '/marketing/rank-management', icon: ListOrdered },
          {
            label: 'Free Learning Resources',
            path: '/marketing/free-learning-resources',
            icon: BookOpenCheck,
          },
        ],
      },
      { label: 'SEO Landing page', path: '/marketing/seo-landing', icon: FileSearch },
      { label: 'Blogs', path: '/marketing/blogs', icon: FileText },
    ],
  },
  {
    id: 'finance',
    label: 'Finance Operations',
    icon: Wallet,
    children: FINANCE_NAV_ITEMS.map(({ label, path, icon }) => ({ label, path, icon })),
  },
  {
    id: 'sales-analytics',
    label: 'Sales & Analytics',
    icon: TrendingUp,
    moduleType: 'sales-analytics',
    children: SALES_ANALYTICS_NAV_ITEMS.map(({ label, path, icon, requiredRoles }) => ({
      label,
      path,
      icon,
      requiredRoles,
    })),
  },
  {
    id: 'bookstore',
    label: 'Bookstore Management',
    icon: BookOpen,
    moduleType: 'bookstore',
    children: BOOKSTORE_NAV_ITEMS.map(({ label, path, icon, permission }) => ({
      label,
      path,
      icon,
      permission,
    })),
  },
  {
    id: 'rewards',
    label: 'Wallet & Rewards',
    icon: Coins,
    children: [
      ...REWARDS_ADMIN_NAV_ITEMS.map(({ label, path, icon }) => ({ label, path, icon })),
      { label: 'Student Portal (Preview)', path: STUDENT_REWARDS_ROUTES.overview, icon: Gift },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: TicketPercent,
    children: [
      { label: 'Live Module', path: '/operations/live-module', icon: Tv },
      { label: 'Reports & Analytics', path: '/analytics', icon: BarChart2 },
      { label: 'Configuration', path: '/operations/configuration', icon: SlidersHorizontal },
      { label: 'Audit Logs', path: '/operations/audit-logs', icon: ScrollText },
    ],
  },
  {
    id: 'system',
    label: 'System Tools',
    icon: Settings,
    children: [
      { label: 'Data Imp / Export', path: '/system/data-import-export', icon: Database },
      { label: 'API Integrations', path: '/system/api-integrations', icon: Plug },
      { label: 'Queue Monitor', path: '/system/queue-monitor', icon: ListOrdered },
    ],
  },
]

/** Whether a nav item (link or nested submenu) matches the current route */
export function isNavItemActive(item, pathname) {
  if (item.id === 'academics-live-classes') {
    return pathname.startsWith('/academics/live-classes')
  }
  if (item.id === 'test-management-configuration') {
    return pathname.startsWith('/test-management/test-configuration')
  }
  if (item.id === 'test-management-cbt') {
    return (
      pathname.startsWith('/test-management/cbt') ||
      pathname.startsWith('/test-management/omr')
    )
  }
  if (item.id === 'test-management-mains') {
    return (
      pathname.startsWith('/test-management/mains') ||
      pathname.startsWith('/test-management/evaluations')
    )
  }
  if (item.path?.startsWith('/finance')) {
    return pathname === '/finance' || pathname.startsWith('/finance/')
  }
  if (item.path?.startsWith('/sales-analytics')) {
    return pathname === '/sales-analytics' || pathname.startsWith('/sales-analytics/')
  }
  if (item.path?.startsWith('/admin/bookstore')) {
    return pathname === '/admin/bookstore' || pathname.startsWith('/admin/bookstore/')
  }
  if (item.path?.startsWith('/admin/rewards')) {
    return pathname === '/admin/rewards' || pathname.startsWith('/admin/rewards/')
  }
  if (item.path?.startsWith('/student')) {
    return pathname === '/student' || pathname.startsWith('/student/')
  }
  if (item.path) {
    if (item.path === '/academics/categories') {
      return (
        pathname === '/academics/categories' ||
        pathname.startsWith('/academics/categories/')
      )
    }
    if (item.path?.startsWith('/academics/live-classes')) {
      return (
        pathname === '/academics/live-classes' ||
        pathname.startsWith('/academics/live-classes/')
      )
    }
    if (item.path?.startsWith('/academics/content-library')) {
      return (
        pathname === '/academics/content-library' ||
        pathname.startsWith('/academics/content-library/')
      )
    }
    if (item.path === '/content-library') {
      return pathname === '/content-library' || pathname.startsWith('/academics/content-library')
    }
    return pathname === item.path || pathname.startsWith(`${item.path}/`)
  }
  if (item.children?.length) {
    return item.children.some((child) => isNavItemActive(child, pathname))
  }
  return false
}

/** Nested submenu id when route is under Categories (Main / Subject) */
export function getSubmenuIdForPath(pathname) {
  for (const group of SIDEBAR_GROUPS) {
    for (const child of group.children) {
      if (child.children?.length && child.children.some((sub) => isNavItemActive(sub, pathname))) {
        return child.id
      }
    }
  }
  return null
}

/** Top-level group id for active-group accordion detection */
export function getGroupIdForPath(pathname, groups = SIDEBAR_GROUPS) {
  for (const group of groups) {
    if (group.children.some((c) => isNavItemActive(c, pathname))) {
      return group.id
    }
  }
  return null
}

export const SETTINGS_NAV = [
  { label: 'Profile', path: '/settings/profile', icon: Users },
  { label: 'Notifications', path: '/settings/notifications', icon: BellRing },
  { label: 'General', path: '/settings/general', icon: Settings },
]
