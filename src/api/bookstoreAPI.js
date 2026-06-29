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
  normalizeBookstoreInventoryViewResponse,
  normalizeBookstoreInventorySearchResponse,
  mapApiInventoryViewToRow,
  mapApiInventoryToRows,
  normalizeBookstoreStatusChangeResponse,
  normalizeBookstoreDeleteResponse,
  buildBookstoreCommerceListParams,
  normalizeBookstoreOrdersListResponse,
  normalizeBookstorePaymentsListResponse,
  normalizeBookstoreInvoicesListResponse,
  normalizeBookstoreRecommendationsListResponse,
  normalizeBookstoreDashboardResponse,
  normalizeBookstoreReportsResponse,
  mapApiOrderToRow,
  mapApiPaymentToRow,
  mapApiRecommendationToRow,
  mapOrderStatusToApi,
  buildRecommendationApiPayload,
  mapRecommendationStatusToApi,
} from '../utils/bookstoreApiHelpers'

const USE_MOCK = isFrontendOnly || import.meta.env.VITE_BOOKSTORE_USE_MOCK === 'true'
const PRODUCTS_BASE = '/admin/bookstore/products'
const INVENTORY_BASE = '/admin/bookstore/inventory'
const COMMERCE_BASE = '/admin/bookstore'

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

function toCommerceError(error, fallback) {
  return toProductError(error, fallback)
}

export async function fetchBookstoreDashboard(params = {}) {
  if (USE_MOCK) {
    return buildBookstoreDashboardPayload(params)
  }

  try {
    const response = await api.get(`${COMMERCE_BASE}/dashboard`, { params })
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch dashboard. Please try again.')
    }

    return normalizeBookstoreDashboardResponse(body)
  } catch (error) {
    throw toCommerceError(error, 'Unable to fetch dashboard. Please try again.')
  }
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

export async function updateBookstoreProduct(productId, payload, assetContext = {}) {
  if (USE_MOCK) {
    const idx = MOCK_BOOKSTORE_PRODUCTS.findIndex((p) => p.id === productId || p.mongoId === productId)
    if (idx < 0) return undefined

    const previous = MOCK_BOOKSTORE_PRODUCTS[idx]
    const previousStock = previous.stockQuantity
    const hasStockUpdate = payload.stockQuantity !== undefined
    const nextStock = hasStockUpdate ? Number(payload.stockQuantity) : previousStock

    MOCK_BOOKSTORE_PRODUCTS[idx] = { ...previous, ...payload }

    if (hasStockUpdate && nextStock !== previousStock) {
      recordProductStockAdjustment(productId, previousStock, nextStock)
    }

    return {
      success: true,
      statusCode: 10000,
      message: 'Product updated successfully',
      product: MOCK_BOOKSTORE_PRODUCTS[idx],
    }
  }

  try {
    const resolvedProductId = String(productId || '').trim()
    if (!resolvedProductId) {
      throw new Error('Product ID is required to update a product.')
    }

    const formData =
      payload instanceof FormData
        ? payload
        : buildProductUpdateFormData(payload, assetContext)

    const response = await api.put(
      `${PRODUCTS_BASE}/update/${encodeURIComponent(resolvedProductId)}`,
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

export async function changeBookstoreProductStatus(mongoId, status) {
  const apiStatus = status === 'ACTIVE' || status === 'DEACTIVATED' ? status : null
  if (!apiStatus) {
    throw new Error('Status must be ACTIVE or DEACTIVATED.')
  }

  if (USE_MOCK) {
    const idx = MOCK_BOOKSTORE_PRODUCTS.findIndex((p) => p.mongoId === mongoId || p.id === mongoId)
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
      mongoId: row?.mongoId || String(mongoId),
      status: apiStatus,
      apiStatus,
      uiStatus: apiStatus === 'ACTIVE' ? 'active' : 'inactive',
      isFeaturedOnHomepage: apiStatus === 'ACTIVE' ? row?.isFeaturedOnHomepage : false,
      homepageSortOrder: apiStatus === 'ACTIVE' ? row?.homepageSortOrder ?? null : null,
    }
  }

  try {
    const resolvedMongoId = String(mongoId || '').trim()
    if (!resolvedMongoId) {
      throw new Error('Product record id is required to update status.')
    }

    const response = await api.patch(
      `${PRODUCTS_BASE}/status/${encodeURIComponent(resolvedMongoId)}`,
      { status: apiStatus },
    )
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

export async function fetchBookstoreInventoryView(productId) {
  const resolvedProductId = String(productId || '').trim()
  if (!resolvedProductId) {
    throw new Error('Product ID is required.')
  }

  if (USE_MOCK) {
    const product = MOCK_BOOKSTORE_PRODUCTS.find((entry) => entry.id === resolvedProductId)
    if (!product) {
      throw new Error('Product not found')
    }

    const alert =
      product.stockQuantity === 0
        ? 'OUT_OF_STOCK'
        : product.stockQuantity <= 20
          ? 'LOW_STOCK'
          : 'OK'

    return mapApiInventoryViewToRow({
      productId: product.id,
      productName: product.name,
      stockQuantity: product.stockQuantity,
      alert,
    })
  }

  try {
    const response = await api.post(`${INVENTORY_BASE}/view`, {
      productId: resolvedProductId,
    })
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch inventory details. Please try again.')
    }

    return normalizeBookstoreInventoryViewResponse(body)
  } catch (error) {
    throw toProductError(error, 'Unable to fetch inventory details. Please try again.')
  }
}

export async function searchBookstoreInventory(search) {
  const term = String(search || '').trim()
  if (!term) {
    throw new Error('Search term is required.')
  }

  if (USE_MOCK) {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    const items = MOCK_BOOKSTORE_PRODUCTS.filter((product) => {
      const haystack = [product.id, product.name].filter(Boolean).join(' ')
      return regex.test(haystack)
    }).map((product) => ({
      _id: product.mongoId || product.id,
      productId: product.id,
      productName: product.name,
      stockQuantity: product.stockQuantity,
      alert:
        product.stockQuantity === 0
          ? 'OUT_OF_STOCK'
          : product.stockQuantity <= 20
            ? 'LOW_STOCK'
            : 'OK',
    }))

    return normalizeBookstoreInventorySearchResponse({ data: { items } })
  }

  try {
    const response = await api.post(`${INVENTORY_BASE}/search`, { search: term })
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to search inventory. Please try again.')
    }

    return normalizeBookstoreInventorySearchResponse(body)
  } catch (error) {
    throw toProductError(error, 'Unable to search inventory. Please try again.')
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
  const resolvedProductId = String(productId || '').trim()
  if (!resolvedProductId) {
    throw new Error('Product ID is required to adjust stock.')
  }

  const action = payload.action === 'DECREASE' ? 'DECREASE' : 'INCREASE'
  const quantity = Number(payload.quantity)
  const reason = String(payload.reason || '').trim()

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a whole number greater than 0.')
  }

  if (reason.length < 3) {
    throw new Error('Reason must be at least 3 characters.')
  }

  if (reason.length > 300) {
    throw new Error('Reason cannot exceed 300 characters.')
  }

  if (USE_MOCK) {
    const product = MOCK_BOOKSTORE_PRODUCTS.find((entry) => entry.id === resolvedProductId)
    if (!product) {
      throw new Error('Product not found')
    }

    if (action === 'DECREASE' && product.stockQuantity < quantity) {
      throw new Error('Insufficient stock available')
    }

    const delta = action === 'INCREASE' ? quantity : -quantity
    applyStockChange(resolvedProductId, delta, {
      reason,
      transactionId: `adjust-${resolvedProductId}-${action}-${quantity}-${Date.now()}`,
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
      `${INVENTORY_BASE}/adjust-stock/${encodeURIComponent(resolvedProductId)}`,
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

export async function fetchBookstoreOrders(params = {}) {
  if (USE_MOCK) {
    return { items: [...MOCK_BOOKSTORE_ORDERS], total: MOCK_BOOKSTORE_ORDERS.length }
  }

  try {
    const response = await api.post(
      `${COMMERCE_BASE}/orders/list`,
      buildBookstoreCommerceListParams(params),
    )
    const body = response?.data ?? {}

    if (!isBookstoreListSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch orders. Please try again.')
    }

    return normalizeBookstoreOrdersListResponse(body, {
      page: params.page || 1,
      limit: params.limit || 100,
    })
  } catch (error) {
    throw toCommerceError(error, 'Unable to fetch orders. Please try again.')
  }
}

export async function fetchBookstoreOrderById(orderId) {
  const resolvedOrderId = String(orderId || '').trim()
  if (!resolvedOrderId) {
    throw new Error('Order ID is required.')
  }

  if (USE_MOCK) {
    return MOCK_BOOKSTORE_ORDERS.find((order) => order.id === resolvedOrderId) ?? null
  }

  try {
    const response = await api.post(`${COMMERCE_BASE}/orders/view`, {
      orderId: resolvedOrderId,
    })
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch order details. Please try again.')
    }

    return mapApiOrderToRow(body.data)
  } catch (error) {
    throw toCommerceError(error, 'Unable to fetch order details. Please try again.')
  }
}

export async function updateBookstoreOrderStatus(orderId, status) {
  const resolvedOrderId = String(orderId || '').trim()
  if (!resolvedOrderId) {
    throw new Error('Order ID is required.')
  }

  const apiStatus = mapOrderStatusToApi(status)

  if (USE_MOCK) {
    const oi = MOCK_BOOKSTORE_ORDERS.findIndex((o) => o.id === resolvedOrderId)
    if (oi < 0) return undefined

    const previousStatus = MOCK_BOOKSTORE_ORDERS[oi].status
    MOCK_BOOKSTORE_ORDERS[oi] = { ...MOCK_BOOKSTORE_ORDERS[oi], status }
    processOrderInventoryChange(MOCK_BOOKSTORE_ORDERS[oi], previousStatus, status)
    return MOCK_BOOKSTORE_ORDERS[oi]
  }

  try {
    const response = await api.patch(
      `${COMMERCE_BASE}/orders/status/${encodeURIComponent(resolvedOrderId)}`,
      { status: apiStatus },
    )
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to update order status. Please try again.')
    }

    return mapApiOrderToRow(body.data)
  } catch (error) {
    throw toCommerceError(error, 'Unable to update order status. Please try again.')
  }
}

export async function updateBookstoreOrderShipment(orderId, shipmentId) {
  const resolvedOrderId = String(orderId || '').trim()
  const resolvedShipmentId = String(shipmentId || '').trim()

  if (!resolvedOrderId) {
    throw new Error('Order ID is required.')
  }

  if (!resolvedShipmentId) {
    throw new Error('Shipment ID is required.')
  }

  if (USE_MOCK) {
    const oi = MOCK_BOOKSTORE_ORDERS.findIndex((o) => o.id === resolvedOrderId)
    if (oi < 0) return undefined

    MOCK_BOOKSTORE_ORDERS[oi] = {
      ...MOCK_BOOKSTORE_ORDERS[oi],
      shipmentId: resolvedShipmentId,
      status:
        MOCK_BOOKSTORE_ORDERS[oi].status === 'Confirmed' ||
        MOCK_BOOKSTORE_ORDERS[oi].status === 'Packed'
          ? 'Shipped'
          : MOCK_BOOKSTORE_ORDERS[oi].status,
    }
    return MOCK_BOOKSTORE_ORDERS[oi]
  }

  try {
    const response = await api.patch(
      `${COMMERCE_BASE}/orders/shipment/${encodeURIComponent(resolvedOrderId)}`,
      { shipmentId: resolvedShipmentId },
    )
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to update shipment. Please try again.')
    }

    return mapApiOrderToRow(body.data)
  } catch (error) {
    throw toCommerceError(error, 'Unable to update shipment. Please try again.')
  }
}

export async function fetchBookstorePayments(params = {}) {
  if (USE_MOCK) {
    return { items: [...MOCK_BOOKSTORE_PAYMENTS], total: MOCK_BOOKSTORE_PAYMENTS.length }
  }

  try {
    const response = await api.post(
      `${COMMERCE_BASE}/payments/list`,
      buildBookstoreCommerceListParams(params),
    )
    const body = response?.data ?? {}

    if (!isBookstoreListSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch payments. Please try again.')
    }

    return normalizeBookstorePaymentsListResponse(body, {
      page: params.page || 1,
      limit: params.limit || 100,
    })
  } catch (error) {
    throw toCommerceError(error, 'Unable to fetch payments. Please try again.')
  }
}

export async function refundBookstorePayment(orderId, options = {}) {
  const resolvedOrderId = String(orderId || '').trim()
  if (!resolvedOrderId) {
    throw new Error('Order ID is required.')
  }

  const reason = String(options.reason || 'Admin initiated refund').trim()

  if (USE_MOCK) {
    const payment = MOCK_BOOKSTORE_PAYMENTS.find((entry) => entry.orderId === resolvedOrderId)
    if (payment) {
      payment.status = 'REFUND_INITIATED'
      setTimeout(() => {
        payment.status = 'REFUNDED'
      }, 0)
    }
    return payment
  }

  try {
    const response = await api.patch(
      `${COMMERCE_BASE}/payments/refund/${encodeURIComponent(resolvedOrderId)}`,
      { reason },
    )
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to process refund. Please try again.')
    }

    return mapApiPaymentToRow(body.data)
  } catch (error) {
    throw toCommerceError(error, 'Unable to process refund. Please try again.')
  }
}

export async function fetchBookstoreWallet() {
  return tryApi(
    () => api.get('/bookstore/wallet'),
    () => ({ transactions: [...MOCK_BOOKSTORE_WALLET_TXNS] }),
  )
}

export async function fetchBookstoreRecommendations(params = {}) {
  if (USE_MOCK) {
    return { items: [...MOCK_BOOKSTORE_RECOMMENDATIONS], total: MOCK_BOOKSTORE_RECOMMENDATIONS.length }
  }

  try {
    const response = await api.post(
      `${COMMERCE_BASE}/recommendations/list`,
      buildBookstoreCommerceListParams(params),
    )
    const body = response?.data ?? {}

    if (!isBookstoreListSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch recommendations. Please try again.')
    }

    return normalizeBookstoreRecommendationsListResponse(body, {
      page: params.page || 1,
      limit: params.limit || 100,
    })
  } catch (error) {
    throw toCommerceError(error, 'Unable to fetch recommendations. Please try again.')
  }
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
  const apiPayload = buildRecommendationApiPayload(payload)

  if (USE_MOCK) {
    const row = {
      recommendationType: apiPayload.recommendationType,
      placement: apiPayload.placement,
      priorityOrder: apiPayload.priorityOrder,
      id: nextRecommendationId(),
      createdAt: new Date().toISOString(),
      ...payload,
      status: mapRecommendationStatusToApi(payload.status),
    }
    MOCK_BOOKSTORE_RECOMMENDATIONS.unshift(row)
    return mapApiRecommendationToRow(row)
  }

  try {
    const response = await api.post(`${COMMERCE_BASE}/recommendations/create`, apiPayload)
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to create recommendation. Please try again.')
    }

    return mapApiRecommendationToRow(body.data)
  } catch (error) {
    throw toCommerceError(error, 'Unable to create recommendation. Please try again.')
  }
}

export async function updateBookstoreRecommendation(id, payload) {
  const resolvedId = String(id || '').trim()
  if (!resolvedId) {
    throw new Error('Recommendation ID is required.')
  }

  const apiPayload = buildRecommendationApiPayload(payload)

  if (USE_MOCK) {
    const idx = MOCK_BOOKSTORE_RECOMMENDATIONS.findIndex((r) => r.id === resolvedId)
    if (idx >= 0) {
      MOCK_BOOKSTORE_RECOMMENDATIONS[idx] = {
        ...MOCK_BOOKSTORE_RECOMMENDATIONS[idx],
        ...payload,
        updatedAt: new Date().toISOString(),
      }
    }
    return mapApiRecommendationToRow(
      MOCK_BOOKSTORE_RECOMMENDATIONS.find((r) => r.id === resolvedId),
    )
  }

  try {
    const response = await api.put(
      `${COMMERCE_BASE}/recommendations/update/${encodeURIComponent(resolvedId)}`,
      apiPayload,
    )
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to update recommendation. Please try again.')
    }

    return mapApiRecommendationToRow(body.data)
  } catch (error) {
    throw toCommerceError(error, 'Unable to update recommendation. Please try again.')
  }
}

export async function changeBookstoreRecommendationStatus(id, status) {
  const resolvedId = String(id || '').trim()
  if (!resolvedId) {
    throw new Error('Recommendation ID is required.')
  }

  const apiStatus = mapRecommendationStatusToApi(status)

  if (USE_MOCK) {
    const idx = MOCK_BOOKSTORE_RECOMMENDATIONS.findIndex((r) => r.id === resolvedId)
    if (idx >= 0) {
      MOCK_BOOKSTORE_RECOMMENDATIONS[idx] = {
        ...MOCK_BOOKSTORE_RECOMMENDATIONS[idx],
        status: apiStatus,
      }
    }
    return mapApiRecommendationToRow(
      MOCK_BOOKSTORE_RECOMMENDATIONS.find((r) => r.id === resolvedId),
    )
  }

  try {
    const response = await api.patch(
      `${COMMERCE_BASE}/recommendations/status/${encodeURIComponent(resolvedId)}`,
      { status: apiStatus },
    )
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to update recommendation status. Please try again.')
    }

    return mapApiRecommendationToRow(body.data)
  } catch (error) {
    throw toCommerceError(error, 'Unable to update recommendation status. Please try again.')
  }
}

export async function deleteBookstoreRecommendation(id) {
  const resolvedId = String(id || '').trim()
  if (!resolvedId) {
    throw new Error('Recommendation ID is required.')
  }

  if (USE_MOCK) {
    const idx = MOCK_BOOKSTORE_RECOMMENDATIONS.findIndex((r) => r.id === resolvedId)
    if (idx >= 0) MOCK_BOOKSTORE_RECOMMENDATIONS.splice(idx, 1)
    return { success: true, deleted: true }
  }

  try {
    const response = await api.delete(
      `${COMMERCE_BASE}/recommendations/delete/${encodeURIComponent(resolvedId)}`,
    )
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to delete recommendation. Please try again.')
    }

    return body.data || { success: true, deleted: true }
  } catch (error) {
    throw toCommerceError(error, 'Unable to delete recommendation. Please try again.')
  }
}

export async function fetchBookstoreInvoices(params = {}) {
  if (USE_MOCK) {
    return { items: [...MOCK_BOOKSTORE_INVOICES], total: MOCK_BOOKSTORE_INVOICES.length }
  }

  try {
    const response = await api.post(
      `${COMMERCE_BASE}/invoices/list`,
      buildBookstoreCommerceListParams(params),
    )
    const body = response?.data ?? {}

    if (!isBookstoreListSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch invoices. Please try again.')
    }

    return normalizeBookstoreInvoicesListResponse(body, {
      page: params.page || 1,
      limit: params.limit || 100,
    })
  } catch (error) {
    throw toCommerceError(error, 'Unable to fetch invoices. Please try again.')
  }
}

export async function downloadBookstoreInvoice(orderId) {
  const resolvedOrderId = String(orderId || '').trim()
  if (!resolvedOrderId) {
    throw new Error('Order ID is required.')
  }

  if (USE_MOCK) {
    const invoice = MOCK_BOOKSTORE_INVOICES.find((entry) => entry.orderId === resolvedOrderId)
    return invoice?.invoiceUrl || null
  }

  try {
    const response = await api.get(
      `${COMMERCE_BASE}/invoices/${encodeURIComponent(resolvedOrderId)}/download`,
      { responseType: 'blob' },
    )

    const contentType = response.headers?.['content-type'] || ''
    if (contentType.includes('application/json')) {
      const text = await new Response(response.data).text()
      const body = JSON.parse(text)
      if (isBookstoreApiSuccess(body) && body?.data?.invoiceUrl) {
        return body.data.invoiceUrl
      }
      throw new Error(body?.message || 'Invoice file not available.')
    }

    const blobUrl = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = `${resolvedOrderId.replace(/[^\w-]+/g, '_')}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1500)
    return true
  } catch (error) {
    throw toCommerceError(error, 'Unable to download invoice. Please try again.')
  }
}

export async function fetchBookstoreReports(params = {}) {
  if (USE_MOCK) {
    return {
      summary: {
        totalBooksSold: 1245,
        totalRevenue: 845200,
        totalOrders: 845,
        bestSellingBook: MOCK_BOOKSTORE_PRODUCTS[0]?.name || '—',
      },
      productSales: MOCK_BOOKSTORE_PRODUCTS.map((p) => ({
        productId: p.id,
        name: p.name,
        units: Math.max(1, 50 - Math.min(p.stockQuantity, 49)),
        revenue: p.discountPrice * 10,
      })),
      dateWise: buildBookstoreDashboardPayload().revenueChart,
      chartDateWise: buildBookstoreDashboardPayload().revenueChart,
    }
  }

  try {
    const response = await api.get(`${COMMERCE_BASE}/reports`, { params })
    const body = response?.data ?? {}

    if (!isBookstoreApiSuccess(body)) {
      throw new Error(body?.message || 'Unable to fetch reports. Please try again.')
    }

    return normalizeBookstoreReportsResponse(body)
  } catch (error) {
    throw toCommerceError(error, 'Unable to fetch reports. Please try again.')
  }
}
