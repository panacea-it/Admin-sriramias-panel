import { ROLES } from '../constants/roles'
import { SIDEBAR_DASHBOARD, SIDEBAR_GROUPS } from '../constants/navigation'
import { canAccessBookstorePermission } from './bookstoreRbac'
import { canAccessOmrPermission } from './omrRbac'
import { OMR_PERMS } from '../constants/omrPermissions'

/** Route prefixes each role may access (settings profile always allowed) */
const SETTINGS_PATHS = [
  '/settings/profile',
  '/settings/notifications',
  '/settings/general',
  '/settings/activity-history',
]

const ROLE_ROUTE_PREFIXES = {
  [ROLES.SUPER_ADMIN]: ['*'],
  [ROLES.CENTER_ADMIN]: [
    '/dashboard',
    '/users/manage',
    '/users/wallet',
    '/coupons',
    '/analytics',
    '/users/centers',
    '/enquiries',
    '/operations/configuration',
    '/finance/*',
    '/sales-analytics/*',
    '/admin/bookstore/*',
    '/admin/rewards/*',
    '/student/*',
    ...SETTINGS_PATHS,
  ],
  [ROLES.OPERATION_ADMIN]: [
    '/dashboard',
    '/academics/batch',
    '/academics/faculty-subjects',
    '/academics/subjects',
    '/courses',
    '/users/manage',
    '/content-library',
    '/academics/content-library',
    '/free-resources',
    '/tests',
    '/test-management/*',
    '/academics/categories',
    '/academics/live-classes',
    '/live-classes',
    '/operations/live-module',
    '/operations/audit-logs',
    '/finance/*',
    '/admin/bookstore/*',
    '/admin/rewards/*',
    '/student/*',
    ...SETTINGS_PATHS,
  ],
  [ROLES.CONTENT_ADMIN]: [
    '/dashboard',
    '/marketing/blogs',
    '/current-affairs',
    '/free-resources',
    '/marketing/seo-landing',
    '/marketing/banners',
    '/marketing/website',
    '/marketing/rank-management',
    '/marketing/free-learning-resources',
    '/marketing/quick-links',
    '/content-library',
    '/academics/content-library',
    '/admin/bookstore/*',
    ...SETTINGS_PATHS,
  ],
  [ROLES.MENTOR_ADMIN]: [
    '/dashboard',
    '/analytics',
    '/crm/help-desk',
    '/operations/audit-logs',
    '/users/manage',
    '/sales-analytics/*',
    '/admin/bookstore/*',
    '/admin/rewards/*',
    '/student/*',
    ...SETTINGS_PATHS,
  ],
  [ROLES.TEACHER_ADMIN]: [
    '/dashboard',
    '/academics/live-classes',
    '/live-classes',
    '/content-library',
    '/academics/content-library',
    '/free-resources',
    '/tests',
    '/test-management/*',
    '/marketing/books',
    ...SETTINGS_PATHS,
  ],
  [ROLES.COUNSELING_ADMIN]: [
    '/dashboard',
    '/crm/leads',
    '/enquiries',
    '/crm/help-desk',
    '/users/wallet',
    '/operations/configuration',
    '/finance/*',
    '/sales-analytics/*',
    '/admin/rewards/*',
    '/student/*',
    ...SETTINGS_PATHS,
  ],
}

/** Nav group / item ids visible per role (maps to navigation.js ids) */
const ROLE_NAV_SCOPE = {
  [ROLES.SUPER_ADMIN]: { groups: '*', dashboard: true },
  [ROLES.CENTER_ADMIN]: {
    dashboard: true,
    groups: ['users', 'crm', 'finance', 'sales-analytics', 'bookstore', 'rewards', 'operations'],
    paths: [
      '/users/manage',
      '/users/wallet',
      '/coupons',
      '/analytics',
      '/users/centers',
      '/enquiries',
      '/operations/configuration',
    ],
  },
  [ROLES.OPERATION_ADMIN]: {
    dashboard: true,
    groups: ['academics', 'test-management', 'users', 'finance', 'bookstore', 'rewards', 'operations'],
    paths: null,
  },
  [ROLES.CONTENT_ADMIN]: {
    dashboard: true,
    groups: ['academics', 'marketing', 'bookstore'],
    paths: null,
  },
  [ROLES.MENTOR_ADMIN]: {
    dashboard: true,
    groups: ['users', 'crm', 'sales-analytics', 'rewards', 'operations'],
    paths: ['/users/manage', '/analytics', '/crm/help-desk', '/operations/audit-logs'],
  },
  [ROLES.TEACHER_ADMIN]: {
    dashboard: true,
    groups: ['academics', 'test-management'],
    paths: null,
  },
  [ROLES.COUNSELING_ADMIN]: {
    dashboard: true,
    groups: ['crm', 'users', 'finance', 'sales-analytics', 'bookstore', 'rewards', 'operations'],
    paths: ['/crm/leads', '/enquiries', '/crm/help-desk', '/users/wallet', '/operations/configuration'],
  },
}

export function getRoleRoutePrefixes(role) {
  return ROLE_ROUTE_PREFIXES[role] || SETTINGS_PATHS
}

function pathMatchesPrefix(pathname, prefix) {
  if (prefix === '*') return true
  if (prefix.endsWith('*')) {
    return pathname.startsWith(prefix.slice(0, -1))
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function canAccessRoute(role, pathname) {
  if (!role) return false
  const prefixes = getRoleRoutePrefixes(role)
  if (prefixes.includes('*')) return true
  return prefixes.some((p) => pathMatchesPrefix(pathname, p))
}

export function getDefaultRouteForRole(role) {
  if (role === ROLES.SUPER_ADMIN) return '/dashboard'
  const prefixes = getRoleRoutePrefixes(role).filter((p) => p !== '*' && !p.startsWith('/settings'))
  return prefixes[0] || '/dashboard'
}

/** Sidebar links under these prefixes follow route-prefix RBAC (not the scoped paths list). */
const MODULE_NAV_PREFIXES = [
  '/finance/',
  '/sales-analytics/',
  '/admin/bookstore/',
  '/admin/rewards/',
  '/student/',
]

function childAllowedForRole(child, role, scope) {
  if (child.permission === OMR_PERMS.VIEW || child.permission === 'omr.view') {
    if (!canAccessOmrPermission(role, OMR_PERMS.VIEW)) return false
  } else if (child.permission && !canAccessBookstorePermission(role, child.permission)) {
    return false
  }
  if (child.requiredRoles?.length && !child.requiredRoles.includes(role)) {
    return false
  }
  if (scope.groups === '*') return true
  if (
    child.path &&
    MODULE_NAV_PREFIXES.some((prefix) => child.path.startsWith(prefix)) &&
    canAccessRoute(role, child.path)
  ) {
    return true
  }
  if (scope.paths?.length && child.path) {
    return scope.paths.some((p) => child.path === p || child.path.startsWith(`${p}/`))
  }
  if (child.path) {
    return canAccessRoute(role, child.path)
  }
  if (child.children?.length) {
    return child.children.some((sub) => childAllowedForRole(sub, role, scope))
  }
  return false
}

function filterNavChildren(children, role, scope) {
  return children
    .map((child) => {
      if (child.children?.length) {
        const filteredSubs = filterNavChildren(child.children, role, scope)
        if (!filteredSubs.length) return null
        return { ...child, children: filteredSubs }
      }
      return childAllowedForRole(child, role, scope) ? child : null
    })
    .filter(Boolean)
}

/** Sidebar groups filtered for the signed-in role */
export function getSidebarGroupsForRole(role) {
  const scope = ROLE_NAV_SCOPE[role]
  if (!scope) return []
  if (scope.groups === '*') return SIDEBAR_GROUPS

  return SIDEBAR_GROUPS.map((group) => {
    if (!scope.groups.includes(group.id)) return null
    const children = filterNavChildren(group.children, role, scope)
    if (!children.length) return null
    return { ...group, children }
  }).filter(Boolean)
}

export function showDashboardNavForRole(role) {
  const scope = ROLE_NAV_SCOPE[role]
  return scope?.dashboard !== false
}

export { SIDEBAR_DASHBOARD }

/** Dashboard section keys per role */
export const DASHBOARD_SECTIONS = {
  hero: 'hero',
  stats: 'stats',
  centerPerformance: 'centerPerformance',
  popularCourses: 'popularCourses',
  revenue: 'revenue',
  activities: 'activities',
  faculty: 'faculty',
  demographics: 'demographics',
  examSuccess: 'examSuccess',
}

const ROLE_DASHBOARD_SECTIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(DASHBOARD_SECTIONS),
  [ROLES.CENTER_ADMIN]: [
    DASHBOARD_SECTIONS.hero,
    DASHBOARD_SECTIONS.stats,
    DASHBOARD_SECTIONS.centerPerformance,
    DASHBOARD_SECTIONS.revenue,
    DASHBOARD_SECTIONS.activities,
  ],
  [ROLES.OPERATION_ADMIN]: [
    DASHBOARD_SECTIONS.hero,
    DASHBOARD_SECTIONS.stats,
    DASHBOARD_SECTIONS.popularCourses,
    DASHBOARD_SECTIONS.activities,
  ],
  [ROLES.CONTENT_ADMIN]: [
    DASHBOARD_SECTIONS.hero,
    DASHBOARD_SECTIONS.stats,
    DASHBOARD_SECTIONS.popularCourses,
    DASHBOARD_SECTIONS.activities,
  ],
  [ROLES.MENTOR_ADMIN]: [
    DASHBOARD_SECTIONS.hero,
    DASHBOARD_SECTIONS.stats,
    DASHBOARD_SECTIONS.activities,
    DASHBOARD_SECTIONS.faculty,
    DASHBOARD_SECTIONS.examSuccess,
  ],
  [ROLES.TEACHER_ADMIN]: [
    DASHBOARD_SECTIONS.hero,
    DASHBOARD_SECTIONS.stats,
    DASHBOARD_SECTIONS.popularCourses,
    DASHBOARD_SECTIONS.activities,
  ],
  [ROLES.COUNSELING_ADMIN]: [
    DASHBOARD_SECTIONS.hero,
    DASHBOARD_SECTIONS.stats,
    DASHBOARD_SECTIONS.activities,
    DASHBOARD_SECTIONS.revenue,
  ],
}

export function getDashboardSectionsForRole(role) {
  return ROLE_DASHBOARD_SECTIONS[role] || [DASHBOARD_SECTIONS.hero, DASHBOARD_SECTIONS.stats]
}

export function roleHasFullAccess(role) {
  return role === ROLES.SUPER_ADMIN
}
