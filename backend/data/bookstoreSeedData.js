/** In-memory bookstore seed — replace with Mongo models when ready */

export const MOCK_PRODUCTS = [
  {
    id: 'BSP-001',
    name: 'UPSC Prelims GS Manual 2026',
    productType: 'Physical Book',
    subject: 'General Studies',
    originalPrice: 1299,
    discountPrice: 999,
    thumbnailUrl: '',
    stockQuantity: 240,
    status: 'active',
  },
  {
    id: 'BSP-002',
    name: 'Indian Polity — Laxmikanth Companion',
    subject: 'Polity',
    originalPrice: 899,
    discountPrice: 749,
    thumbnailUrl: '',
    status: 'active',
  },
  {
    id: 'BSP-005',
    name: 'Ethics Case Studies Handbook',
    subject: 'Ethics',
    originalPrice: 1100,
    discountPrice: 880,
    thumbnailUrl: '',
    status: 'active',
  },
  {
    id: 'BSP-006',
    name: 'Indian Economy General Studies Book-1',
    subject: 'Economy',
    originalPrice: 795,
    discountPrice: 636,
    thumbnailUrl: '',
    status: 'active',
    isBestseller: true,
  },
]

export const MOCK_ORDERS = [
  {
    id: 'BSO-1001',
    customerName: 'Aarav Patel',
    email: 'aarav@example.com',
    items: [{ productId: 'BSP-001', name: 'UPSC Prelims GS Manual 2026', qty: 1, price: 999 }],
    total: 999,
    status: 'Delivered',
    paymentStatus: 'Paid',
  },
]

export const MOCK_COMBOS = []
export const MOCK_BUNDLES = []
export const MOCK_PAYMENTS = []
export const MOCK_WALLET = []
export let MOCK_RECOMMENDATIONS = [
  {
    id: 'REC-001',
    sourceProductId: 'BSP-006',
    recommendationType: 'Cart Recommendations',
    placement: 'Cart Drawer',
    recommendedProductIds: ['BSP-002', 'BSP-005', 'BSP-001'],
    priorityOrder: 1,
    status: 'active',
    bestsellerProductIds: ['BSP-002'],
  },
]
export const MOCK_INVOICES = []
export const MOCK_INVENTORY_LOGS = []

export function buildDashboard() {
  const revenue = MOCK_ORDERS.filter((o) => o.paymentStatus === 'Paid').reduce((s, o) => s + o.total, 0)
  return {
    stats: {
      totalRevenue: revenue,
      totalOrders: MOCK_ORDERS.length,
      totalProducts: MOCK_PRODUCTS.length,
      totalCombos: MOCK_COMBOS.length,
      pendingOrders: 0,
      deliveredOrders: MOCK_ORDERS.filter((o) => o.status === 'Delivered').length,
      lowStockProducts: 0,
      topSellingProducts: 1,
    },
    revenueChart: [
      { label: 'Mon', amount: 4200 },
      { label: 'Tue', amount: 5100 },
      { label: 'Wed', amount: 3800 },
    ],
    productSalesChart: [{ label: 'GS Manual', units: 45 }],
    orderTrends: [{ label: 'W1', orders: 12 }],
    comboPerformance: [],
    recentOrders: MOCK_ORDERS,
    lowStockAlerts: [],
    bestSellers: MOCK_PRODUCTS.map((p) => ({ ...p, unitsSold: 10 })),
  }
}
