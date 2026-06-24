import { isFrontendOnly } from '../config/appMode'
import api from './axiosInstance'
import {
  MOCK_BOOKSTORE_PRODUCTS,
  MOCK_BOOKSTORE_ORDERS,
  MOCK_BOOKSTORE_COMBOS,
  MOCK_BOOKSTORE_BUNDLES,
  MOCK_BOOKSTORE_PAYMENTS,
  MOCK_BOOKSTORE_WALLET_TXNS,
  MOCK_BOOKSTORE_RECOMMENDATIONS,
  nextRecommendationId,
  MOCK_BOOKSTORE_INVOICES,
  buildBookstoreDashboardPayload,
  nextProductId,
  nextComboId,
  nextBundleId,
} from '../data/bookstoreMockData'
import { resolveCartRecommendations } from '../utils/bookstoreRecommendationUtils'
import {
  applyStockChange,
  getSortedInventoryLogs,
  processOrderInventoryChange,
  recordInitialStock,
  recordProductStockAdjustment,
} from '../utils/bookstoreInventory'

const USE_MOCK = isFrontendOnly || import.meta.env.VITE_BOOKSTORE_USE_MOCK !== 'false'

async function tryApi(fn, fallback) {
  if (USE_MOCK) return fallback()
  try {
    const res = await fn()
    const body = res.data
    return body?.data ?? body
  } catch {
    return fallback()
  }
}

export async function fetchBookstoreDashboard(params = {}) {
  return tryApi(
    () => api.get('/bookstore/dashboard', { params }),
    () => buildBookstoreDashboardPayload(params),
  )
}

export async function fetchBookstoreProducts(params = {}) {
  return tryApi(
    () => api.get('/bookstore/products', { params }),
    () => ({ items: [...MOCK_BOOKSTORE_PRODUCTS], total: MOCK_BOOKSTORE_PRODUCTS.length }),
  )
}

export async function createBookstoreProduct(payload) {
  return tryApi(
    () => api.post('/bookstore/products', payload),
    () => {
      const row = { id: nextProductId(), status: 'active', createdAt: new Date().toISOString(), ...payload }
      MOCK_BOOKSTORE_PRODUCTS.unshift(row)
      recordInitialStock(row.id, Number(payload.stockQuantity) || 0)
      return row
    },
  )
}

export async function updateBookstoreProduct(id, payload) {
  return tryApi(
    () => api.put(`/bookstore/products/${id}`, payload),
    () => {
      const idx = MOCK_BOOKSTORE_PRODUCTS.findIndex((p) => p.id === id)
      if (idx < 0) return undefined

      const previous = MOCK_BOOKSTORE_PRODUCTS[idx]
      const previousStock = previous.stockQuantity
      const hasStockUpdate = payload.stockQuantity !== undefined
      const nextStock = hasStockUpdate ? Number(payload.stockQuantity) : previousStock

      MOCK_BOOKSTORE_PRODUCTS[idx] = { ...previous, ...payload }

      if (hasStockUpdate && nextStock !== previousStock) {
        recordProductStockAdjustment(id, previousStock, nextStock)
      }

      return MOCK_BOOKSTORE_PRODUCTS[idx]
    },
  )
}

export async function deleteBookstoreProduct(id) {
  return tryApi(
    () => api.delete(`/bookstore/products/${id}`),
    () => {
      const i = MOCK_BOOKSTORE_PRODUCTS.findIndex((p) => p.id === id)
      if (i >= 0) MOCK_BOOKSTORE_PRODUCTS.splice(i, 1)
      return { success: true }
    },
  )
}

export async function fetchBookstoreInventory() {
  return tryApi(
    () => api.get('/bookstore/inventory'),
    () => ({
      products: MOCK_BOOKSTORE_PRODUCTS,
      logs: getSortedInventoryLogs(),
    }),
  )
}

export async function restockBookstoreProduct(id, quantity, options = {}) {
  const { reason = 'Restock', transactionId } = options
  return tryApi(
    () => api.post(`/bookstore/inventory/${id}/restock`, { quantity, reason, transactionId }),
    () => {
      applyStockChange(id, quantity, {
        reason,
        transactionId: transactionId || `restock-${id}-${quantity}-${Date.now()}`,
      })
      return MOCK_BOOKSTORE_PRODUCTS.find((p) => p.id === id)
    },
  )
}

export async function fetchBookstoreCombos() {
  return tryApi(
    () => api.get('/bookstore/combos'),
    () => ({ items: [...MOCK_BOOKSTORE_COMBOS] }),
  )
}

export async function saveBookstoreCombo(payload, id) {
  return tryApi(
    () => (id ? api.put(`/bookstore/combos/${id}`, payload) : api.post('/bookstore/combos', payload)),
    () => {
      if (id) {
        const ci = MOCK_BOOKSTORE_COMBOS.findIndex((c) => c.id === id)
        if (ci >= 0) MOCK_BOOKSTORE_COMBOS[ci] = { ...MOCK_BOOKSTORE_COMBOS[ci], ...payload }
        return MOCK_BOOKSTORE_COMBOS.find((c) => c.id === id)
      }
      const row = { id: nextComboId(), status: 'active', ...payload }
      MOCK_BOOKSTORE_COMBOS.unshift(row)
      return row
    },
  )
}

export async function fetchBookstoreBundles() {
  return tryApi(
    () => api.get('/bookstore/bundles'),
    () => ({ items: [...MOCK_BOOKSTORE_BUNDLES] }),
  )
}

export async function saveBookstoreBundle(payload, id) {
  return tryApi(
    () => (id ? api.put(`/bookstore/bundles/${id}`, payload) : api.post('/bookstore/bundles', payload)),
    () => {
      if (id) {
        const bi = MOCK_BOOKSTORE_BUNDLES.findIndex((b) => b.id === id)
        if (bi >= 0) MOCK_BOOKSTORE_BUNDLES[bi] = { ...MOCK_BOOKSTORE_BUNDLES[bi], ...payload }
        return MOCK_BOOKSTORE_BUNDLES.find((b) => b.id === id)
      }
      const row = { id: nextBundleId(), status: 'active', ...payload }
      MOCK_BOOKSTORE_BUNDLES.unshift(row)
      return row
    },
  )
}

export async function fetchBookstoreOrders() {
  return tryApi(
    () => api.get('/bookstore/orders'),
    () => ({ items: [...MOCK_BOOKSTORE_ORDERS] }),
  )
}

export async function updateBookstoreOrderStatus(id, status) {
  return tryApi(
    () => api.patch(`/bookstore/orders/${id}/status`, { status }),
    () => {
      const oi = MOCK_BOOKSTORE_ORDERS.findIndex((o) => o.id === id)
      if (oi < 0) return undefined

      const previousStatus = MOCK_BOOKSTORE_ORDERS[oi].status
      MOCK_BOOKSTORE_ORDERS[oi] = { ...MOCK_BOOKSTORE_ORDERS[oi], status }
      processOrderInventoryChange(MOCK_BOOKSTORE_ORDERS[oi], previousStatus, status)
      return MOCK_BOOKSTORE_ORDERS[oi]
    },
  )
}

export async function fetchBookstorePayments() {
  return tryApi(
    () => api.get('/bookstore/payments'),
    () => ({ items: [...MOCK_BOOKSTORE_PAYMENTS] }),
  )
}

export async function fetchBookstoreWallet() {
  return tryApi(
    () => api.get('/bookstore/wallet'),
    () => ({ transactions: [...MOCK_BOOKSTORE_WALLET_TXNS] }),
  )
}

export async function fetchBookstoreRecommendations() {
  return tryApi(
    () => api.get('/bookstore/recommendations'),
    () => ({ items: [...MOCK_BOOKSTORE_RECOMMENDATIONS] }),
  )
}

/** Student portal + admin preview — cart “You May Also Like” */
export async function fetchCartRecommendations(sourceProductId, params = {}) {
  return tryApi(
    () => api.get('/bookstore/recommendations/cart', { params: { sourceProductId, ...params } }),
    () =>
      resolveCartRecommendations(
        MOCK_BOOKSTORE_RECOMMENDATIONS,
        MOCK_BOOKSTORE_PRODUCTS,
        {
          sourceProductId,
          placement: params.placement,
          recommendationType: params.recommendationType,
        },
      ),
  )
}

export async function createBookstoreRecommendation(payload) {
  return tryApi(
    () => api.post('/bookstore/recommendations', payload),
    () => {
      const row = {
        recommendationType: 'Cart Recommendations',
        placement: 'Cart Drawer',
        priorityOrder: 1,
        id: nextRecommendationId(),
        createdAt: new Date().toISOString(),
        ...payload,
      }
      MOCK_BOOKSTORE_RECOMMENDATIONS.unshift(row)
      return row
    },
  )
}

export async function updateBookstoreRecommendation(id, payload) {
  return tryApi(
    () => api.put(`/bookstore/recommendations/${id}`, payload),
    () => {
      const idx = MOCK_BOOKSTORE_RECOMMENDATIONS.findIndex((r) => r.id === id)
      if (idx >= 0) {
        MOCK_BOOKSTORE_RECOMMENDATIONS[idx] = {
          ...MOCK_BOOKSTORE_RECOMMENDATIONS[idx],
          ...payload,
          updatedAt: new Date().toISOString(),
        }
      }
      return MOCK_BOOKSTORE_RECOMMENDATIONS.find((r) => r.id === id)
    },
  )
}

export async function deleteBookstoreRecommendation(id) {
  return tryApi(
    () => api.delete(`/bookstore/recommendations/${id}`),
    () => {
      const idx = MOCK_BOOKSTORE_RECOMMENDATIONS.findIndex((r) => r.id === id)
      if (idx >= 0) MOCK_BOOKSTORE_RECOMMENDATIONS.splice(idx, 1)
      return { success: true }
    },
  )
}

export async function fetchBookstoreInvoices() {
  return tryApi(
    () => api.get('/bookstore/invoices'),
    () => ({ items: [...MOCK_BOOKSTORE_INVOICES] }),
  )
}

export async function fetchBookstoreReports(params = {}) {
  return tryApi(
    () => api.get('/bookstore/reports', { params }),
    () => ({
      productSales: MOCK_BOOKSTORE_PRODUCTS.map((p) => ({
        productId: p.id,
        name: p.name,
        units: Math.max(1, 50 - Math.min(p.stockQuantity, 49)),
        revenue: p.discountPrice * 10,
      })),
      dateWise: buildBookstoreDashboardPayload().revenueChart,
    }),
  )
}
