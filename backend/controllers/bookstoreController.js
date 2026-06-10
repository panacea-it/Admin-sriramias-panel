import {
  MOCK_PRODUCTS,
  MOCK_ORDERS,
  MOCK_COMBOS,
  MOCK_BUNDLES,
  MOCK_PAYMENTS,
  MOCK_WALLET,
  MOCK_RECOMMENDATIONS,
  MOCK_INVOICES,
  MOCK_INVENTORY_LOGS,
  buildDashboard,
} from '../data/bookstoreSeedData.js'

function ok(res, data) {
  res.json({ success: true, data })
}

export function getDashboard(req, res) {
  ok(res, buildDashboard(req.query))
}

export function listProducts(req, res) {
  ok(res, { items: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length })
}

export function createProduct(req, res) {
  const row = { id: `BSP-${Date.now()}`, status: 'active', createdAt: new Date().toISOString(), ...req.body }
  MOCK_PRODUCTS.unshift(row)
  ok(res, row)
}

export function updateProduct(req, res) {
  const idx = MOCK_PRODUCTS.findIndex((p) => p.id === req.params.id)
  if (idx < 0) return res.status(404).json({ success: false, message: 'Not found' })
  MOCK_PRODUCTS[idx] = { ...MOCK_PRODUCTS[idx], ...req.body }
  ok(res, MOCK_PRODUCTS[idx])
}

export function deleteProduct(req, res) {
  const idx = MOCK_PRODUCTS.findIndex((p) => p.id === req.params.id)
  if (idx >= 0) MOCK_PRODUCTS.splice(idx, 1)
  ok(res, { success: true })
}

export function getInventory(req, res) {
  ok(res, { products: MOCK_PRODUCTS, logs: MOCK_INVENTORY_LOGS })
}

export function restockProduct(req, res) {
  const p = MOCK_PRODUCTS.find((x) => x.id === req.params.id)
  if (!p) return res.status(404).json({ success: false, message: 'Not found' })
  p.stockQuantity += Number(req.body.quantity) || 0
  ok(res, p)
}

export function listCombos(req, res) {
  ok(res, { items: MOCK_COMBOS })
}

export function createCombo(req, res) {
  const row = { id: `BSC-${Date.now()}`, status: 'active', ...req.body }
  MOCK_COMBOS.unshift(row)
  ok(res, row)
}

export function listBundles(req, res) {
  ok(res, { items: MOCK_BUNDLES })
}

export function createBundle(req, res) {
  const row = { id: `BSB-${Date.now()}`, status: 'active', ...req.body }
  MOCK_BUNDLES.unshift(row)
  ok(res, row)
}

export function listOrders(req, res) {
  ok(res, { items: MOCK_ORDERS })
}

export function patchOrderStatus(req, res) {
  const o = MOCK_ORDERS.find((x) => x.id === req.params.id)
  if (!o) return res.status(404).json({ success: false, message: 'Not found' })
  o.status = req.body.status
  ok(res, o)
}

export function listPayments(req, res) {
  ok(res, { items: MOCK_PAYMENTS })
}

export function listWallet(req, res) {
  ok(res, { transactions: MOCK_WALLET })
}

export function listRecommendations(req, res) {
  ok(res, { items: MOCK_RECOMMENDATIONS })
}

function discountPercent(orig, disc) {
  if (!orig || disc >= orig) return 0
  return Math.round(((orig - disc) / orig) * 100)
}

function resolveCartRecs(sourceProductId, placement = 'Cart Drawer', recommendationType = 'Cart Recommendations') {
  const rule = [...MOCK_RECOMMENDATIONS]
    .filter(
      (r) =>
        r.status === 'active' &&
        r.sourceProductId === sourceProductId &&
        r.placement === placement &&
        r.recommendationType === recommendationType,
    )
    .sort((a, b) => (a.priorityOrder ?? 99) - (b.priorityOrder ?? 99))[0]

  if (!rule) return { title: 'You May Also Like', placement, products: [] }

  const ids = rule.recommendedProductIds || rule.targetProductIds || []
  const bestsellerIds = rule.bestsellerProductIds || []
  const products = ids
    .map((id) => MOCK_PRODUCTS.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({
      id: p.id,
      name: p.name,
      thumbnailUrl: p.thumbnailUrl || '',
      originalPrice: p.originalPrice,
      discountPrice: p.discountPrice,
      discountPercent: discountPercent(p.originalPrice, p.discountPrice),
      isBestseller: bestsellerIds.includes(p.id) || Boolean(p.isBestseller),
    }))

  return {
    title: 'You May Also Like',
    placement,
    recommendationType: rule.recommendationType,
    ruleId: rule.id,
    products,
  }
}

export function getCartRecommendations(req, res) {
  const { sourceProductId, placement, recommendationType } = req.query
  if (!sourceProductId) {
    return res.status(400).json({ success: false, message: 'sourceProductId required' })
  }
  ok(
    res,
    resolveCartRecs(sourceProductId, placement || 'Cart Drawer', recommendationType || 'Cart Recommendations'),
  )
}

export function createRecommendation(req, res) {
  const row = { id: `REC-${Date.now()}`, ...req.body }
  MOCK_RECOMMENDATIONS.unshift(row)
  ok(res, row)
}

export function updateRecommendation(req, res) {
  const idx = MOCK_RECOMMENDATIONS.findIndex((r) => r.id === req.params.id)
  if (idx < 0) return res.status(404).json({ success: false, message: 'Not found' })
  MOCK_RECOMMENDATIONS[idx] = { ...MOCK_RECOMMENDATIONS[idx], ...req.body }
  ok(res, MOCK_RECOMMENDATIONS[idx])
}

export function deleteRecommendation(req, res) {
  const idx = MOCK_RECOMMENDATIONS.findIndex((r) => r.id === req.params.id)
  if (idx >= 0) MOCK_RECOMMENDATIONS.splice(idx, 1)
  ok(res, { success: true })
}

export function listInvoices(req, res) {
  ok(res, { items: MOCK_INVOICES })
}

export function getReports(req, res) {
  ok(res, {
    productSales: MOCK_PRODUCTS.map((p) => ({
      productId: p.id,
      name: p.name,
      units: 10,
      revenue: p.discountPrice * 10,
    })),
    dateWise: buildDashboard().revenueChart,
  })
}
