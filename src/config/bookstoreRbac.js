import { ROLES } from '../constants/roles'
import { BOOKSTORE_NAV_ITEMS } from '../constants/bookstoreNav'

/** Bookstore module role keys for permission matrix */
export const BOOKSTORE_ROLES = {
  SUPER_ADMIN: 'bookstore_super_admin',
  CONTENT_ADMIN: 'bookstore_content_admin',
  SALES_ADMIN: 'bookstore_sales_admin',
  INVENTORY_ADMIN: 'bookstore_inventory_admin',
}

export const BOOKSTORE_ROLE_LABELS = {
  [BOOKSTORE_ROLES.SUPER_ADMIN]: 'Super Admin',
  [BOOKSTORE_ROLES.CONTENT_ADMIN]: 'Content Admin',
  [BOOKSTORE_ROLES.SALES_ADMIN]: 'Sales Admin',
  [BOOKSTORE_ROLES.INVENTORY_ADMIN]: 'Inventory Admin',
}

const ALL_PERMISSIONS = BOOKSTORE_NAV_ITEMS.map((item) => item.permission)

export const BOOKSTORE_PERMISSION_MATRIX = {
  [BOOKSTORE_ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,
  [BOOKSTORE_ROLES.CONTENT_ADMIN]: [
    'dashboard',
    'products',
    'combos',
    'bundles',
    'recommendations',
    'reports',
  ],
  [BOOKSTORE_ROLES.SALES_ADMIN]: [
    'dashboard',
    'orders',
    'payments',
    'wallet',
    'invoices',
    'reports',
  ],
  [BOOKSTORE_ROLES.INVENTORY_ADMIN]: [
    'dashboard',
    'products',
    'inventory',
    'combos',
    'reports',
  ],
}

/** Map platform IAM role → bookstore permissions */
const PLATFORM_BOOKSTORE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ALL_PERMISSIONS,
  [ROLES.CONTENT_ADMIN]: BOOKSTORE_PERMISSION_MATRIX[BOOKSTORE_ROLES.CONTENT_ADMIN],
  [ROLES.OPERATION_ADMIN]: BOOKSTORE_PERMISSION_MATRIX[BOOKSTORE_ROLES.INVENTORY_ADMIN],
  [ROLES.COUNSELING_ADMIN]: BOOKSTORE_PERMISSION_MATRIX[BOOKSTORE_ROLES.SALES_ADMIN],
  [ROLES.CENTER_ADMIN]: [
    'dashboard',
    'orders',
    'payments',
    'reports',
  ],
}

export function getBookstorePermissionsForPlatformRole(role) {
  return PLATFORM_BOOKSTORE_PERMISSIONS[role] || []
}

export function canAccessBookstorePermission(role, permission) {
  const perms = getBookstorePermissionsForPlatformRole(role)
  return perms.includes(permission)
}

export function filterBookstoreNavForRole(role) {
  const allowed = new Set(getBookstorePermissionsForPlatformRole(role))
  return BOOKSTORE_NAV_ITEMS.filter((item) => allowed.has(item.permission))
}

export function canAccessBookstoreRoute(role, pathname) {
  const item = BOOKSTORE_NAV_ITEMS.find(
    (nav) => pathname === nav.path || pathname.startsWith(`${nav.path}/`),
  )
  if (!item) return getBookstorePermissionsForPlatformRole(role).length > 0
  return canAccessBookstorePermission(role, item.permission)
}
