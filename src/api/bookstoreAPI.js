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
import { getApiErrorMessage } from '../utils/apiError'
import {
  buildBookstoreListParams,
  buildProductFormData,
  buildProductUpdateFormData,
  isBookstoreApiSuccess,
  isBookstoreListSuccess,
  mapApiProductViewToRow,
  normalizeBookstoreListResponse,
  normalizeBookstoreInventoryListResponse,
  buildBookstoreInventoryListParams,
  normalizeBookstoreInventoryLogsResponse,
  buildBookstoreInventoryLogsParams,
  normalizeBookstoreAdjustStockResponse,
  normalizeBookstoreStatusChangeResponse,
  normalizeBookstoreDeleteResponse,
} from '../utils/bookstoreApiHelpers'

const USE_MOCK = isFrontendOnly || import.meta.env.VITE_BOOKSTORE_USE_MOCK === 'true'
const PRODUCTS_BASE = '/admin/bookstore/products'
const INVENTORY_BASE = '/admin/bookstore/inventory'

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

function toProductError(error, fallback) {
  const err = new Error(getApiErrorMessage(error, fallback))
  err.cause = error
  return err
}

export async function fetchBookstoreDashboard(params = {}) {
  return tryApi(
    () => api.get('/bookstore/dashboard', { params }),
    () => buildBookstoreDashboardPayload(params),
  )
}

export async function fetchBookstoreExamCategories() {
  if (USE_MOCK) {
    return []
  }

  try {
    const response = await api.get(`${PRODUCTS_BASE}/exam-categories`)
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch exam categories. Please try again.')
    }

    const items = body?.data?.items ?? body?.items ?? []
    return Array.isArray(items) ? items : []
  } catch (error) {
    throw toProductError(error, 'Unable to fetch exam categories. Please try again.')
  }
}

export async function fetchBookstoreProductsPage(params = {}) {
  if (USE_MOCK) {
    const items = [...MOCK_BOOKSTORE_PRODUCTS]
    return {
      items,
      count: items.length,
      total: items.length,
      totalPages: 1,
      page: 1,
      limit: params.limit || 10,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }

  try {
    const response = await api.post(`${PRODUCTS_BASE}/list`, buildBookstoreListParams(params))
    const body = response?.data ?? {}

    if (!isBookstoreListSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch products. Please try again.')
    }

    return normalizeBookstoreListResponse(body, {
      page: params.page || 1,
      limit: params.limit || 10,
      categoryLookup: params.categoryLookup || {},
    })
  } catch (error) {
    throw toProductError(error, 'Unable to fetch products. Please try again.')
  }
}

export async function fetchBookstoreProducts(params = {}) {
  const result = await fetchBookstoreProductsPage({
    ...params,
    page: params.page || 1,
    limit: params.limit || 100,
  })
  return { items: result.items, total: result.total }
}

export async function fetchBookstoreProductById(productId) {
  if (USE_MOCK) {
    return MOCK_BOOKSTORE_PRODUCTS.find((product) => product.id === productId) ?? null
  }

  try {
    const response = await api.post(`${PRODUCTS_BASE}/view`, { productId })
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch product details. Please try again.')
    }

    return mapApiProductViewToRow(body.data)
  } catch (error) {
    throw toProductError(error, 'Unable to fetch product details. Please try again.')
  }
}

export async function createBookstoreProduct(payload, assetContext = {}) {
  if (USE_MOCK) {
    const row = {
      id: nextProductId(),
      status: 'active',
      createdAt: new Date().toISOString(),
      ...payload,
    }
    MOCK_BOOKSTORE_PRODUCTS.unshift(row)
    recordInitialStock(row.id, Number(payload.stockQuantity) || 0)
    return {
      success: true,
      statusCode: 10000,
      message: 'Product created successfully',
      product: row,
    }
  }

  try {
    const formData =
      payload instanceof FormData
        ? payload
        : buildProductFormData(payload, assetContext)

    const response = await api.post(`${PRODUCTS_BASE}/create`, formData)
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to create product. Please try again.')
    }

    return {
      success: body.success,
      statusCode: body.statusCode,
      message: body.message || 'Product created successfully',
      product: mapApiProductViewToRow(body.data),
    }
  } catch (error) {
    throw toProductError(error, 'Unable to create product. Please try again.')
  }
}

export async function updateBookstoreProduct(id, payload, assetContext = {}) {
  if (USE_MOCK) {
    const idx = MOCK_BOOKSTORE_PRODUCTS.findIndex((p) => p.id === id || p.mongoId === id)
    if (idx < 0) return undefined

    const previous = MOCK_BOOKSTORE_PRODUCTS[idx]
    const previousStock = previous.stockQuantity
    const hasStockUpdate = payload.stockQuantity !== undefined
    const nextStock = hasStockUpdate ? Number(payload.stockQuantity) : previousStock

    MOCK_BOOKSTORE_PRODUCTS[idx] = { ...previous, ...payload }

    if (hasStockUpdate && nextStock !== previousStock) {
      recordProductStockAdjustment(id, previousStock, nextStock)
    }

    return {
      success: true,
      statusCode: 10000,
      message: 'Product updated successfully',
      product: MOCK_BOOKSTORE_PRODUCTS[idx],
    }
  }

  try {
    const mongoId = id
    const formData =
      payload instanceof FormData
        ? payload
        : buildProductUpdateFormData(payload, assetContext)

    const response = await api.put(
      `${PRODUCTS_BASE}/update/${encodeURIComponent(mongoId)}`,
      formData,
    )
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to update product. Please try again.')
    }

    return {
      success: body.success,
      statusCode: body.statusCode,
      message: body.message || 'Product updated successfully',
      product: mapApiProductViewToRow(body.data),
    }
  } catch (error) {
    throw toProductError(error, 'Unable to update product. Please try again.')
  }
}

export async function changeBookstoreProductStatus(id, status) {
  if (USE_MOCK) {
    const idx = MOCK_BOOKSTORE_PRODUCTS.findIndex((p) => p.id === id || p.mongoId === id)
    if (idx >= 0) {
      MOCK_BOOKSTORE_PRODUCTS[idx] = {
        ...MOCK_BOOKSTORE_PRODUCTS[idx],
        status: status === 'ACTIVE' ? 'active' : 'inactive',
      }
    }

    const row = MOCK_BOOKSTORE_PRODUCTS[idx]
    return {
      success: true,
      statusCode: 10000,
      message: 'Product status updated successfully',
      productId: row?.id || '',
      mongoId: row?.mongoId || String(id),
      status: status === 'ACTIVE' ? 'ACTIVE' : 'DEACTIVATED',
      apiStatus: status === 'ACTIVE' ? 'ACTIVE' : 'DEACTIVATED',
      uiStatus: status === 'ACTIVE' ? 'active' : 'inactive',
    }
  }

  try {
    const response = await api.patch(`${PRODUCTS_BASE}/status/${encodeURIComponent(id)}`, {
      status,
    })
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to update product status. Please try again.')
    }

    return normalizeBookstoreStatusChangeResponse(body)
  } catch (error) {
    throw toProductError(error, 'Unable to update product status. Please try again.')
  }
}

export async function deleteBookstoreProduct(id) {
  if (USE_MOCK) {
    const i = MOCK_BOOKSTORE_PRODUCTS.findIndex((p) => p.id === id || p.mongoId === id)
    const removed = i >= 0 ? MOCK_BOOKSTORE_PRODUCTS[i] : null
    if (i >= 0) MOCK_BOOKSTORE_PRODUCTS.splice(i, 1)

    return {
      success: true,
      statusCode: 10000,
      message: 'Product deleted successfully',
      productId: removed?.id || '',
      mongoId: removed?.mongoId || String(id),
      deleted: true,
    }
  }

  try {
    const response = await api.delete(`${PRODUCTS_BASE}/delete/${encodeURIComponent(id)}`)
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to delete the product. Please try again.')
    }

    return normalizeBookstoreDeleteResponse(body)
  } catch (error) {
    throw toProductError(error, 'Unable to delete the product. Please try again.')
  }
}

function buildMockInventoryListPage(params = {}) {
  const search = String(params.search || '').trim().toLowerCase()
  const page = params.page || 1
  const limit = params.limit || 10

  let rawItems = MOCK_BOOKSTORE_PRODUCTS.map((product) => ({
    _id: product.mongoId || product.id,
    productId: product.id,
    productName: product.name,
    stockQuantity: Number(product.stockQuantity) || 0,
    alert:
      product.stockQuantity === 0
        ? 'OUT_OF_STOCK'
        : product.stockQuantity <= 20
          ? 'LOW_STOCK'
          : 'OK',
  }))

  if (search) {
    rawItems = rawItems.filter((item) => {
      const haystack = [item.productId, item.productName].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(search)
    })
  }

  const total = rawItems.length
  const totalPages = Math.ceil(total / limit) || 0
  const start = (page - 1) * limit

  return normalizeBookstoreInventoryListResponse(
    {
      data: {
        items: rawItems.slice(start, start + limit),
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    },
    { page, limit },
  )
}

export async function fetchBookstoreInventoryPage(params = {}) {
  if (USE_MOCK) {
    return buildMockInventoryListPage(params)
  }

  try {
    const response = await api.post(
      `${INVENTORY_BASE}/list`,
      buildBookstoreInventoryListParams(params),
    )
    const body = response?.data ?? {}

    if (!isBookstoreListSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch inventory records. Please try again.')
    }

    return normalizeBookstoreInventoryListResponse(body, {
      page: params.page || 1,
      limit: params.limit || 10,
    })
  } catch (error) {
    throw toProductError(error, 'Unable to fetch inventory records. Please try again.')
  }
}

function buildMockInventoryLogsPage(params = {}) {
  const productId = String(params.productId || '').trim()
  const page = params.page || 1
  const limit = params.limit || 10

  let rawItems = getSortedInventoryLogs().map((log, index) => {
    const product = MOCK_BOOKSTORE_PRODUCTS.find((entry) => entry.id === log.productId)

    return {
      _id: log.id || `mock-log-${index}`,
      productId: log.productId,
      productName: product?.name || log.productId,
      stockChange: log.change,
      stockAfter: log.stockAfter,
      reason: log.reason,
      actionType: log.change > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
      createdAt: log.createdAt,
    }
  })

  if (productId) {
    rawItems = rawItems.filter((item) => item.productId === productId)
  }

  const total = rawItems.length
  const totalPages = Math.ceil(total / limit) || 0
  const start = (page - 1) * limit

  return normalizeBookstoreInventoryLogsResponse(
    {
      data: {
        items: rawItems.slice(start, start + limit),
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      },
    },
    { page, limit },
  )
}

export async function fetchBookstoreInventoryLogsPage(params = {}) {
  if (USE_MOCK) {
    return buildMockInventoryLogsPage(params)
  }

  try {
    const response = await api.post(
      `${INVENTORY_BASE}/logs`,
      buildBookstoreInventoryLogsParams(params),
    )
    const body = response?.data ?? {}

    if (!isBookstoreListSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch inventory logs. Please try again.')
    }

    return normalizeBookstoreInventoryLogsResponse(body, {
      page: params.page || 1,
      limit: params.limit || 10,
    })
  } catch (error) {
    throw toProductError(error, 'Unable to fetch inventory logs. Please try again.')
  }
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

export async function adjustBookstoreStock(productId, payload = {}) {
  const action = payload.action === 'DECREASE' ? 'DECREASE' : 'INCREASE'
  const quantity = Number(payload.quantity)
  const reason = String(payload.reason || '').trim()

  if (USE_MOCK) {
    const product = MOCK_BOOKSTORE_PRODUCTS.find((entry) => entry.id === productId)
    if (!product) {
      throw new Error('Product not found')
    }

    if (action === 'DECREASE' && product.stockQuantity < quantity) {
      throw new Error('Insufficient stock available')
    }

    const delta = action === 'INCREASE' ? quantity : -quantity
    applyStockChange(productId, delta, {
      reason,
      transactionId: `adjust-${productId}-${action}-${quantity}-${Date.now()}`,
    })

    const alert =
      product.stockQuantity === 0
        ? 'OUT_OF_STOCK'
        : product.stockQuantity <= 20
          ? 'LOW_STOCK'
          : 'OK'
    const latestLog = getSortedInventoryLogs()[0]

    return normalizeBookstoreAdjustStockResponse({
      success: true,
      statusCode: 10000,
      message: 'Stock updated successfully',
      data: {
        product: {
          productId: product.id,
          productName: product.name,
          stockQuantity: product.stockQuantity,
          alert,
        },
        log: {
          _id: latestLog?.id || `mock-log-${Date.now()}`,
          productId: product.id,
          productName: product.name,
          stockChange: delta,
          stockAfter: product.stockQuantity,
          reason,
          actionType: action === 'INCREASE' ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
          createdAt: latestLog?.createdAt || new Date().toISOString(),
        },
      },
    })
  }

  try {
    const response = await api.put(
      `${INVENTORY_BASE}/adjust-stock/${encodeURIComponent(productId)}`,
      {
        action,
        quantity,
        reason,
      },
    )
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to update stock. Please try again.')
    }

    return normalizeBookstoreAdjustStockResponse(body)
  } catch (error) {
    throw toProductError(error, 'Unable to update stock. Please try again.')
  }
}

export async function restockBookstoreProduct(id, quantity, options = {}) {
  const { reason = 'Restock' } = options
  const absQuantity = Math.abs(Number(quantity))

  if (!absQuantity) return null

  return adjustBookstoreStock(id, {
    action: quantity >= 0 ? 'INCREASE' : 'DECREASE',
    quantity: absQuantity,
    reason,
  })
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
