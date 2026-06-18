const now = new Date()
const iso = (d) => d.toISOString()

export const BOOKSTORE_EXAM_CATEGORIES = [
  'UPSC',
  'APPSC',
  'TSPSC',
  'Group 1',
  'Group 2',
  'SSC',
  'Banking',
  'Railways',
  'Other',
]

export const BOOKSTORE_LANGUAGES = [
  'English',
  'Telugu',
  'Hindi',
  'Tamil',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Bengali',
]

export const BOOKSTORE_ORDER_STATUSES = [
  'Pending',
  'Confirmed',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
]
export const BOOKSTORE_COMBO_TYPES = ['Book + Course', 'Book + Test Series', 'Book + Book']

let productSeq = 13
let orderSeq = 8
let comboSeq = 4
let bundleSeq = 3

export let MOCK_BOOKSTORE_PRODUCTS = [
  {
    id: 'BSP-001',
    name: 'UPSC Prelims GS Manual 2026 — Complete Edition',
    productType: 'Physical Book',
    description: 'Comprehensive GS manual with 2,500+ MCQs and previous-year analysis.',
    subject: 'UPSC Books',
    authorName: 'Dr. R. Sharma',
    isbn: '978-93-81234-01-1',
    language: 'English',
    originalPrice: 1299,
    discountPrice: 999,
    thumbnailUrl: '',
    previewPdfUrl: '',
    stockQuantity: 240,
    weight: '1.2 kg',
    dimensions: '24×18×3 cm',
    status: 'active',
    createdAt: iso(new Date(now - 86400000 * 30)),
  },
  {
    id: 'BSP-002',
    name: 'Indian Polity — Laxmikanth Companion Notes',
    productType: 'Physical Book',
    description: 'Chapter-wise notes and MCQs aligned with Laxmikanth 6th Edition.',
    subject: 'Polity',
    authorName: 'Academy Editorial',
    isbn: '978-93-81234-02-8',
    language: 'English',
    originalPrice: 899,
    discountPrice: 749,
    thumbnailUrl: '',
    previewPdfUrl: '',
    keywords: ['UPSC', 'Indian Polity', 'Laxmikanth', 'Civil Services'],
    sampleImages: [],
    stockQuantity: 18,
    weight: '0.9 kg',
    dimensions: '22×16×2.5 cm',
    status: 'active',
    createdAt: iso(new Date(now - 86400000 * 20)),
  },
  {
    id: 'BSP-003',
    name: 'Monthly Current Affairs Digest — June 2026',
    productType: 'E-Book',
    description: 'Downloadable monthly digest with PIB analysis and exam-ready summaries.',
    subject: 'Current Affairs',
    authorName: 'Editorial Team',
    isbn: '978-93-81234-03-5',
    language: 'English',
    originalPrice: 299,
    discountPrice: 199,
    thumbnailUrl: '',
    previewPdfUrl: '/samples/preview.pdf',
    stockQuantity: 9999,
    weight: '—',
    dimensions: '—',
    status: 'active',
    createdAt: iso(new Date(now - 86400000 * 10)),
  },
  {
    id: 'BSP-004',
    name: 'CSAT Paper-II — Logical Reasoning & Comprehension',
    productType: 'Study Material',
    description: 'Topic-wise practice sets for UPSC CSAT with detailed solutions.',
    subject: 'CSAT',
    authorName: 'Prof. Mehta',
    isbn: '978-93-81234-04-2',
    language: 'English',
    originalPrice: 650,
    discountPrice: 520,
    thumbnailUrl: '',
    previewPdfUrl: '',
    stockQuantity: 0,
    weight: '0.7 kg',
    dimensions: '21×15×2 cm',
    status: 'inactive',
    createdAt: iso(new Date(now - 86400000 * 5)),
  },
  {
    id: 'BSP-005',
    name: 'Ethics, Integrity & Aptitude — Case Studies Handbook',
    productType: 'Physical Book',
    description: 'GS-IV ethics cases with model answers and thinkers\' quotes.',
    subject: 'Ethics',
    authorName: 'Dr. Priya Nair',
    isbn: '978-93-81234-05-9',
    language: 'English',
    originalPrice: 1100,
    discountPrice: 880,
    thumbnailUrl: '',
    previewPdfUrl: '',
    stockQuantity: 52,
    weight: '1.0 kg',
    dimensions: '23×17×2.8 cm',
    status: 'active',
    createdAt: iso(new Date(now - 86400000 * 2)),
  },
  {
    id: 'BSP-006',
    name: 'Indian Economy — Ramesh Singh GS Companion',
    productType: 'Physical Book',
    description: 'Complete Indian Economy coverage for UPSC General Studies Paper III.',
    subject: 'Economy',
    authorName: 'Ramesh Singh',
    isbn: '978-93-81234-06-6',
    language: 'English',
    originalPrice: 795,
    discountPrice: 636,
    thumbnailUrl: '',
    previewPdfUrl: '',
    stockQuantity: 120,
    weight: '1.1 kg',
    dimensions: '23×17×2.5 cm',
    status: 'active',
    isBestseller: true,
    createdAt: iso(new Date(now - 86400000 * 8)),
  },
  {
    id: 'BSP-007',
    name: 'A Brief History of Modern India — Spectrum Notes',
    productType: 'Physical Book',
    description: 'Condensed notes covering 1857–1947 with timeline charts and map work.',
    subject: 'History',
    authorName: 'Rajiv Ahir',
    isbn: '978-93-81234-07-3',
    language: 'English',
    originalPrice: 850,
    discountPrice: 680,
    thumbnailUrl: '',
    previewPdfUrl: '',
    stockQuantity: 95,
    weight: '1.0 kg',
    dimensions: '22×16×2.4 cm',
    status: 'active',
    createdAt: iso(new Date(now - 86400000 * 15)),
  },
  {
    id: 'BSP-008',
    name: 'Certificate Physical & Human Geography — G.C. Leong Guide',
    productType: 'Physical Book',
    description: 'Visual geography guide with diagrams for Prelims and Mains map-based questions.',
    subject: 'Geography',
    authorName: 'G.C. Leong',
    isbn: '978-93-81234-08-0',
    language: 'English',
    originalPrice: 720,
    discountPrice: 576,
    thumbnailUrl: '',
    previewPdfUrl: '',
    stockQuantity: 64,
    weight: '0.95 kg',
    dimensions: '23×17×2.2 cm',
    status: 'active',
    createdAt: iso(new Date(now - 86400000 * 12)),
  },
  {
    id: 'BSP-009',
    name: 'Public Administration Optional — Paper I & II Set',
    productType: 'Physical Book',
    description: 'Two-volume set covering thinkers, administrative theories, and answer writing.',
    subject: 'Optional Subjects',
    authorName: 'Dr. Vikram Joshi',
    isbn: '978-93-81234-09-7',
    language: 'English',
    originalPrice: 1499,
    discountPrice: 1199,
    thumbnailUrl: '',
    previewPdfUrl: '',
    stockQuantity: 34,
    weight: '1.8 kg',
    dimensions: '24×18×4 cm',
    status: 'active',
    createdAt: iso(new Date(now - 86400000 * 7)),
  },
  {
    id: 'BSP-010',
    name: 'UPSC Mains Answer Writing Workbook — GS Papers I–IV',
    productType: 'Study Material',
    description: 'Structured answer templates with 150+ model answers for Mains practice.',
    subject: 'UPSC Books',
    authorName: 'Academy Editorial',
    isbn: '978-93-81234-10-3',
    language: 'English',
    originalPrice: 980,
    discountPrice: 784,
    thumbnailUrl: '',
    previewPdfUrl: '',
    stockQuantity: 78,
    weight: '1.3 kg',
    dimensions: '24×18×3 cm',
    status: 'active',
    createdAt: iso(new Date(now - 86400000 * 4)),
  },
  {
    id: 'BSP-011',
    name: 'Weekly Current Affairs Quiz Bank — 52 Weeks',
    productType: 'E-Book',
    description: 'Weekly MCQ sets with explanations covering national and international events.',
    subject: 'Current Affairs',
    authorName: 'Editorial Team',
    isbn: '978-93-81234-11-0',
    language: 'English',
    originalPrice: 449,
    discountPrice: 359,
    thumbnailUrl: '',
    previewPdfUrl: '/samples/preview.pdf',
    stockQuantity: 9999,
    weight: '—',
    dimensions: '—',
    status: 'active',
    createdAt: iso(new Date(now - 86400000 * 3)),
  },
  {
    id: 'BSP-012',
    name: 'Sociology Optional — Thinkers & Theories Compendium',
    productType: 'Physical Book',
    description: 'Comprehensive optional subject guide with PYQ analysis and sample answers.',
    subject: 'Optional Subjects',
    authorName: 'Dr. Ananya Desai',
    isbn: '978-93-81234-12-7',
    language: 'English',
    originalPrice: 1250,
    discountPrice: 999,
    thumbnailUrl: '',
    previewPdfUrl: '',
    stockQuantity: 22,
    weight: '1.4 kg',
    dimensions: '23×17×3 cm',
    status: 'inactive',
    createdAt: iso(new Date(now - 86400000 * 1)),
  },
]

export let MOCK_BOOKSTORE_ORDERS = [
  {
    id: 'BSO-1001',
    customerName: 'Aarav Patel',
    email: 'aarav@example.com',
    items: [{ productId: 'BSP-001', name: 'UPSC Prelims GS Manual 2026', qty: 1, price: 999 }],
    total: 999,
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentGateway: 'Razorpay',
    shipmentId: 'SHP-7781',
    createdAt: iso(new Date(now - 86400000 * 2)),
  },
  {
    id: 'BSO-1002',
    customerName: 'Sneha Reddy',
    email: 'sneha@example.com',
    items: [
      { productId: 'BSP-002', name: 'Indian Polity — Laxmikanth Companion', qty: 2, price: 749 },
    ],
    total: 1498,
    status: 'Shipped',
    paymentStatus: 'Paid',
    paymentGateway: 'Cashfree',
    shipmentId: 'SHP-7782',
    createdAt: iso(new Date(now - 86400000 * 1)),
  },
  {
    id: 'BSO-1003',
    customerName: 'Rahul Verma',
    email: 'rahul@example.com',
    items: [{ productId: 'BSP-003', name: 'Current Affairs Digest', qty: 1, price: 199 }],
    total: 199,
    status: 'Pending',
    paymentStatus: 'Pending',
    paymentGateway: 'Razorpay',
    shipmentId: null,
    createdAt: iso(now),
  },
]

export let MOCK_BOOKSTORE_COMBOS = [
  {
    id: 'BSC-01',
    name: 'UPSC Foundation Combo',
    comboType: 'Book + Course',
    productIds: ['BSP-001', 'BSP-003'],
    originalTotal: 1198,
    comboPrice: 999,
    discountPercent: 17,
    status: 'active',
  },
  {
    id: 'BSC-02',
    name: 'Polity + Test Series',
    comboType: 'Book + Test Series',
    productIds: ['BSP-002'],
    originalTotal: 1499,
    comboPrice: 1199,
    discountPercent: 20,
    status: 'active',
  },
]

export let MOCK_BOOKSTORE_BUNDLES = [
  {
    id: 'BSB-01',
    name: 'Buy 2 Get 1 Free — GS Books',
    offerType: 'Buy X Get Y',
    buyQty: 2,
    getQty: 1,
    discountValue: null,
    productIds: ['BSP-001', 'BSP-005'],
    startsAt: iso(new Date(now - 86400000 * 7)),
    endsAt: iso(new Date(now + 86400000 * 23)),
    status: 'active',
  },
  {
    id: 'BSB-02',
    name: 'Flat ₹200 off Ethics',
    offerType: 'Flat Discount',
    buyQty: 1,
    getQty: 0,
    discountValue: 200,
    productIds: ['BSP-005'],
    startsAt: iso(new Date(now - 86400000 * 3)),
    endsAt: iso(new Date(now + 86400000 * 10)),
    status: 'active',
  },
]

export const MOCK_BOOKSTORE_PAYMENTS = [
  {
    id: 'PAY-9001',
    orderId: 'BSO-1001',
    gateway: 'Razorpay',
    amount: 999,
    status: 'Success',
    txnId: 'rzp_abc123',
    createdAt: iso(new Date(now - 86400000 * 2)),
  },
  {
    id: 'PAY-9002',
    orderId: 'BSO-1002',
    gateway: 'Cashfree',
    amount: 1498,
    status: 'Success',
    txnId: 'cf_xyz789',
    createdAt: iso(new Date(now - 86400000 * 1)),
  },
  {
    id: 'PAY-9003',
    orderId: 'BSO-1003',
    gateway: 'Razorpay',
    amount: 199,
    status: 'Failed',
    txnId: 'rzp_fail001',
    createdAt: iso(now),
  },
]

export const MOCK_BOOKSTORE_WALLET_TXNS = [
  { id: 'WT-01', user: 'Aarav Patel', type: 'credit', points: 50, reason: 'Order BSO-1001', createdAt: iso(new Date(now - 86400000 * 2)) },
  { id: 'WT-02', user: 'Sneha Reddy', type: 'debit', points: 100, reason: 'Redeemed on order', createdAt: iso(new Date(now - 86400000 * 1)) },
]

let recommendationSeq = 3

export function nextRecommendationId() {
  recommendationSeq += 1
  return `REC-${String(recommendationSeq).padStart(3, '0')}`
}

export let MOCK_BOOKSTORE_RECOMMENDATIONS = [
  {
    id: 'REC-001',
    sourceProductId: 'BSP-006',
    recommendationType: 'Cart Recommendations',
    placement: 'Cart Drawer',
    recommendedProductIds: ['BSP-002', 'BSP-005', 'BSP-001'],
    priorityOrder: 1,
    status: 'active',
    bestsellerProductIds: ['BSP-002'],
    createdAt: iso(new Date(now - 86400000 * 15)),
  },
  {
    id: 'REC-002',
    sourceProductId: 'BSP-001',
    recommendationType: 'Related Books',
    placement: 'Product Page',
    recommendedProductIds: ['BSP-002', 'BSP-006'],
    priorityOrder: 2,
    status: 'active',
    bestsellerProductIds: [],
    createdAt: iso(new Date(now - 86400000 * 8)),
  },
  {
    id: 'REC-003',
    sourceProductId: 'BSP-002',
    recommendationType: 'Frequently Bought Together',
    placement: 'Product Page',
    recommendedProductIds: ['BSP-006', 'BSP-001'],
    priorityOrder: 1,
    status: 'active',
    bestsellerProductIds: ['BSP-006'],
    createdAt: iso(new Date(now - 86400000 * 3)),
  },
]

export const MOCK_BOOKSTORE_INVOICES = [
  { id: 'INV-5001', orderId: 'BSO-1001', gstin: '29AABCU9603R1ZX', amount: 999, status: 'Generated', createdAt: iso(new Date(now - 86400000 * 2)) },
  { id: 'INV-5002', orderId: 'BSO-1002', gstin: '29AABCU9603R1ZX', amount: 1498, status: 'Generated', createdAt: iso(new Date(now - 86400000 * 1)) },
]

export let MOCK_INVENTORY_LOGS = [
  { id: 'LOG-1', productId: 'BSP-001', change: -2, reason: 'Order BSO-1001', stockAfter: 240, createdAt: iso(new Date(now - 86400000 * 2)) },
  { id: 'LOG-2', productId: 'BSP-002', change: +50, reason: 'Restock', stockAfter: 68, createdAt: iso(new Date(now - 86400000 * 1)) },
]

export function nextProductId() {
  productSeq += 1
  return `BSP-${String(productSeq).padStart(3, '0')}`
}

export function nextOrderId() {
  orderSeq += 1
  return `BSO-${1000 + orderSeq}`
}

export function nextComboId() {
  comboSeq += 1
  return `BSC-${String(comboSeq).padStart(2, '0')}`
}

export function nextBundleId() {
  bundleSeq += 1
  return `BSB-${String(bundleSeq).padStart(2, '0')}`
}

function stockStatusLabel(qty, min = 20) {
  if (qty <= 0) return 'Critical'
  if (qty <= min * 0.3) return 'Critical'
  if (qty <= min) return 'Low'
  if (qty <= min * 1.2) return 'Reorder Needed'
  return 'Safe'
}

export function buildBookstoreDashboardPayload({ dateFrom, dateTo } = {}) {
  const products = MOCK_BOOKSTORE_PRODUCTS
  const orders = MOCK_BOOKSTORE_ORDERS
  const paidRevenue = orders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + o.total, 0)

  const revenueChart = [
    { label: 'Mon', day: 'Mon', amount: 12000 },
    { label: 'Tue', day: 'Tue', amount: 18000 },
    { label: 'Wed', day: 'Wed', amount: 22000 },
    { label: 'Thu', day: 'Thu', amount: 28000 },
    { label: 'Fri', day: 'Fri', amount: 35000 },
    { label: 'Sat', day: 'Sat', amount: 42000 },
    { label: 'Sun', day: 'Sun', amount: 39000 },
  ]
  const weekRevenue = revenueChart.reduce((s, d) => s + d.amount, 0)

  const productSalesChart = [
    { label: 'UPSC Prelims', name: 'UPSC Prelims', units: 186, sales: 186 },
    { label: 'Indian Polity', name: 'Indian Polity', units: 142, sales: 142 },
    { label: 'Ethics', name: 'Ethics', units: 98, sales: 98 },
    { label: 'Current Affairs', name: 'Current Affairs', units: 76, sales: 76 },
    { label: 'Quantitative Aptitude', name: 'Quantitative Aptitude', units: 64, sales: 64 },
    { label: 'Essay Writing', name: 'Essay Writing', units: 52, sales: 52 },
  ]

  const orderTrends = [
    { label: 'Week 1', week: 'W1', orders: 48 },
    { label: 'Week 2', week: 'W2', orders: 62 },
    { label: 'Week 3', week: 'W3', orders: 55 },
    { label: 'Week 4', week: 'W4', orders: 71 },
  ]

  const comboPerformance = [
    { label: 'UPSC Foundation Combo', name: 'UPSC Foundation Combo', value: 38, sales: 38 },
    { label: 'Polity + Ethics Combo', name: 'Polity + Ethics Combo', value: 28, sales: 28 },
    { label: 'Prelims Booster Combo', name: 'Prelims Booster Combo', value: 22, sales: 22 },
    { label: 'Test Series Bundle', name: 'Test Series Bundle', value: 12, sales: 12 },
  ]

  const suppliers = ['Pearson India', 'NCERT Depot', 'Arihant Wholesale', 'McGraw Hill', 'S. Chand']
  const lowStockAlerts = products
    .filter((p) => p.stockQuantity <= 25)
    .map((p, i) => ({
      ...p,
      sku: p.id,
      productName: p.name,
      category: p.subject || p.productType,
      currentStock: p.stockQuantity,
      minimumStock: 20,
      supplier: suppliers[i % suppliers.length],
      lastUpdated: iso(new Date(now - 86400000 * (i + 1))),
      status: stockStatusLabel(p.stockQuantity, 20),
    }))

  const bestSellers = [...products]
    .map((p) => {
      const unitsSold = Math.max(10, 120 - p.stockQuantity)
      return {
        ...p,
        unitsSold,
        revenue: unitsSold * p.discountPrice,
        category: p.subject || 'General',
        rating: (4.2 + (p.stockQuantity % 5) * 0.15).toFixed(1),
        trend: unitsSold > 80 ? 'up' : 'down',
        trendPercent: 5 + (unitsSold % 20),
        maxUnits: 150,
      }
    })
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 8)
    .map((p, i) => ({ ...p, rank: i + 1, isTopSeller: i < 3 }))

  const recentOrders = orders.map((o) => ({
    ...o,
    product: o.items?.[0]?.name || '—',
    paymentStatus: o.paymentStatus || 'Pending',
    deliveryStatus: o.status,
    orderedDate: o.createdAt,
  }))

  return {
    stats: {
      totalRevenue: 245000,
      totalOrders: orders.length + 24,
      totalProducts: products.length,
      totalCombos: MOCK_BOOKSTORE_COMBOS.length,
      pendingOrders: orders.filter((o) => o.status === 'Pending').length,
      deliveredOrders: orders.filter((o) => o.status === 'Delivered').length,
      lowStockProducts: lowStockAlerts.length,
      topSellingProducts: bestSellers.length,
      totalCustomers: 1842,
      monthlyGrowth: 12.5,
      bestSellingCategory: 'UPSC Prelims',
      weekRevenue,
      paidRevenue,
    },
    kpiTrends: {
      totalRevenue: { value: 12.5, up: true },
      totalOrders: { value: 8.2, up: true },
      pendingOrders: { value: 3.1, up: false },
      deliveredOrders: { value: 14.6, up: true },
      lowStockProducts: { value: 5, up: false },
      totalCustomers: { value: 9.4, up: true },
      monthlyGrowth: { value: 12.5, up: true },
      bestSellingCategory: { value: 18, up: true },
    },
    sparklines: {
      totalRevenue: [180, 195, 210, 220, 235, 245, 252],
      totalOrders: [32, 38, 35, 42, 48, 52, 58],
      pendingOrders: [5, 4, 6, 3, 4, 2, 1],
      deliveredOrders: [28, 30, 32, 38, 40, 45, 48],
    },
    revenueChart,
    productSalesChart,
    orderTrends,
    comboPerformance,
    recentOrders,
    lowStockAlerts,
    bestSellers,
    activities: [
      { id: 'a1', type: 'order', title: 'New order received', detail: 'BSO-1003 — Rahul Verma', time: '12 min ago' },
      { id: 'a2', type: 'stock', title: 'Product out of stock', detail: 'Quantitative Aptitude Workbook', time: '1 hr ago' },
      { id: 'a3', type: 'combo', title: 'Combo purchased', detail: 'UPSC Foundation Combo', time: '2 hrs ago' },
      { id: 'a4', type: 'payment', title: 'Payment received', detail: '₹1,498 via Cashfree', time: '3 hrs ago' },
      { id: 'a5', type: 'refund', title: 'Refund initiated', detail: 'Order BSO-1002 partial', time: '5 hrs ago' },
    ],
    performanceSummary: {
      conversionRate: 68,
      avgOrderValue: 1240,
      fulfillmentRate: 94,
      repeatCustomers: 42,
    },
    filters: { dateFrom, dateTo },
  }
}
