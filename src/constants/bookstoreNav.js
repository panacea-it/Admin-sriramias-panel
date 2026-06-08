import {
  LayoutDashboard,
  Package,
  Warehouse,
  Layers,
  Gift,
  ShoppingCart,
  CreditCard,
  Wallet,
  Sparkles,
  FileText,
  BarChart3,
} from 'lucide-react'

export const BOOKSTORE_BASE = '/admin/bookstore'

export const BOOKSTORE_ROUTES = {
  dashboard: `${BOOKSTORE_BASE}/dashboard`,
  products: `${BOOKSTORE_BASE}/products`,
  inventory: `${BOOKSTORE_BASE}/inventory`,
  combos: `${BOOKSTORE_BASE}/combos`,
  bundles: `${BOOKSTORE_BASE}/bundles`,
  orders: `${BOOKSTORE_BASE}/orders`,
  payments: `${BOOKSTORE_BASE}/payments`,
  wallet: `${BOOKSTORE_BASE}/wallet`,
  recommendations: `${BOOKSTORE_BASE}/recommendations`,
  invoices: `${BOOKSTORE_BASE}/invoices`,
  reports: `${BOOKSTORE_BASE}/reports`,
}

export const BOOKSTORE_NAV_ITEMS = [
  { label: 'Dashboard', path: BOOKSTORE_ROUTES.dashboard, icon: LayoutDashboard, permission: 'dashboard' },
  { label: 'Products', path: BOOKSTORE_ROUTES.products, icon: Package, permission: 'products' },
  { label: 'Inventory', path: BOOKSTORE_ROUTES.inventory, icon: Warehouse, permission: 'inventory' },
  { label: 'Combos', path: BOOKSTORE_ROUTES.combos, icon: Layers, permission: 'combos' },
  { label: 'Bundle Offers', path: BOOKSTORE_ROUTES.bundles, icon: Gift, permission: 'bundles' },
  { label: 'Orders', path: BOOKSTORE_ROUTES.orders, icon: ShoppingCart, permission: 'orders' },
  { label: 'Payments', path: BOOKSTORE_ROUTES.payments, icon: CreditCard, permission: 'payments' },
  { label: 'Wallet & Rewards', path: BOOKSTORE_ROUTES.wallet, icon: Wallet, permission: 'wallet' },
  { label: 'Recommendations', path: BOOKSTORE_ROUTES.recommendations, icon: Sparkles, permission: 'recommendations' },
  { label: 'Invoices', path: BOOKSTORE_ROUTES.invoices, icon: FileText, permission: 'invoices' },
  { label: 'Reports & Analytics', path: BOOKSTORE_ROUTES.reports, icon: BarChart3, permission: 'reports' },
]

export function isBookstorePath(pathname) {
  return pathname === BOOKSTORE_BASE || pathname.startsWith(`${BOOKSTORE_BASE}/`)
}
