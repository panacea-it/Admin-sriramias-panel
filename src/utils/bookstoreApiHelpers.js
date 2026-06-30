import { parseStockQuantity } from './bookstoreProductForm'

export const BOOKSTORE_API_SUCCESS_CODE = 10000

export function isBookstoreApiSuccess(response) {
  if (!response || response.success !== true) return false
  if (response.statusCode == null) return true
  return response.statusCode === BOOKSTORE_API_SUCCESS_CODE
}

export const isBookstoreMutationSuccess = isBookstoreApiSuccess
export const isBookstoreListSuccess = isBookstoreApiSuccess

function formatDateFields(isoValue) {
  const value = isoValue ? new Date(isoValue) : null
  if (!value || Number.isNaN(value.getTime())) {
    return { time: '—', date: '—', iso: null }
  }

  return {
    iso: value.toISOString(),
    time: value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    date: value.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }
}

export function mapApiStatusToUi(status) {
  if (status === 'ACTIVE') return 'active'
  if (status === 'DEACTIVATED') return 'inactive'
  return status || 'active'
}

export function mapUiStatusToApi(status) {
  if (status === 'active' || status === 'Active') return 'ACTIVE'
  if (status === 'inactive' || status === 'Inactive' || status === 'Deactivated') {
    return 'DEACTIVATED'
  }
  return status
}

export function resolveCategoryDisplayId(examCategoryName, categoryLookup = {}) {
  if (!examCategoryName) return '—'
  const match = categoryLookup.byName?.[examCategoryName]
  return match?.categoryId || '—'
}

export function mapApiProductListItemToRow(item, index = 0, categoryLookup = {}) {
  if (!item) return null

  const created = formatDateFields(item.createdAt)
  const updated = formatDateFields(item.updatedAt || item.createdAt)

  const isFeatured =
    item.isFeaturedOnHomepage === true ||
    item.isFeaturedOnHomepage === 'true' ||
    item.isFeaturedOnHomepage === '1'

  return {
    id: item.productId || item.id || '',
    mongoId: String(item._id || item.mongoId || ''),
    name: item.productName || item.name || '',
    authorName: item.authorName || '',
    examCategory: item.examCategoryName || item.examCategory || '',
    examCategoryId: item.examCategoryId ? String(item.examCategoryId) : '',
    categoryDisplayId: resolveCategoryDisplayId(
      item.examCategoryName || item.examCategory,
      categoryLookup,
    ),
    originalPrice: Number(item.originalPrice) || 0,
    discountPrice:
      Number(item.discountPrice ?? item.discountedPrice) ||
      (Number(item.originalPrice) > 0 ? Number(item.originalPrice) : 0),
    stockQuantity: Number(item.stockQuantity) || 0,
    thumbnailUrl: item.thumbnailUrl || item.thumbnail?.url || item.thumbnail || '',
    previewPdf: item.previewPdf?.url || item.previewPdf || null,
    previewPdfFileName: item.previewPdf?.fileName || item.previewPdfFileName || null,
    status: mapApiStatusToUi(item.status),
    apiStatus: item.status || '',
    isFeaturedOnHomepage: isFeatured,
    homepageSortOrder:
      item.homepageSortOrder === null || item.homepageSortOrder === undefined
        ? null
        : Number(item.homepageSortOrder),
    catalogSortOrder:
      item.catalogSortOrder === null || item.catalogSortOrder === undefined
        ? null
        : Number(item.catalogSortOrder),
    createdAt: created.iso,
    createdDate: created.date,
    createdTime: created.time,
    updatedAt: updated.iso,
    updatedDate: updated.date,
    updatedTime: updated.time,
    _index: index,
  }
}

export function mapApiProductViewToRow(item, categoryLookup = {}) {
  if (!item) return null

  const row = mapApiProductListItemToRow(item, 0, categoryLookup)
  if (!row) return null

  return {
    ...row,
    examCategoryId: item.examCategoryId ? String(item.examCategoryId) : row.examCategoryId,
    description: item.bookSummary || item.description || '',
    isbn: item.isbn || '',
    previewImages: Array.isArray(item.previewImages)
      ? item.previewImages
      : item.sampleImages || [],
    previewVideoUrl: item.previewVideoUrl || item.previewVideo || '',
    previewPdf: row.previewPdf,
    previewPdfFileName: row.previewPdfFileName,
    isFeaturedOnHomepage: row.isFeaturedOnHomepage,
    homepageSortOrder: row.homepageSortOrder,
    catalogSortOrder: row.catalogSortOrder,
    soldQuantity: item.soldQuantity ?? 0,
    apiStatus: item.status || '',
  }
}

export function mapApiProductsToRows(items = [], categoryLookup = {}) {
  return items
    .map((item, index) => mapApiProductListItemToRow(item, index, categoryLookup))
    .filter(Boolean)
}

export function normalizeBookstoreStatusChangeResponse(body) {
  const data = body?.data && typeof body.data === 'object' ? body.data : {}

  const isFeatured =
    data.isFeaturedOnHomepage === true ||
    data.isFeaturedOnHomepage === 'true' ||
    data.isFeaturedOnHomepage === '1'

  return {
    success: body?.success === true,
    statusCode: body?.statusCode,
    message: body?.message || 'Product status updated successfully',
    productId: data.productId || '',
    mongoId: String(data._id || ''),
    status: data.status || '',
    apiStatus: data.status || '',
    uiStatus: mapApiStatusToUi(data.status),
    isFeaturedOnHomepage: isFeatured,
    homepageSortOrder:
      data.homepageSortOrder === null || data.homepageSortOrder === undefined
        ? null
        : Number(data.homepageSortOrder),
  }
}

export function normalizeBookstoreDeleteResponse(body) {
  const data = body?.data && typeof body.data === 'object' ? body.data : {}

  return {
    success: body?.success === true,
    statusCode: body?.statusCode,
    message: body?.message || 'Product deleted successfully',
    productId: data.productId || '',
    mongoId: String(data._id || ''),
    deleted: data.deleted === true,
  }
}

export function buildCategoryLookup(categories = []) {
  const byId = {}
  const byName = {}

  categories.forEach((category) => {
    if (!category?._id) return
    byId[String(category._id)] = category
    const name = category.categoryName
    if (name && !byName[name]) {
      byName[name] = category
    }
  })

  return { byId, byName }
}

export function normalizeBookstoreListResponse(data, { page = 1, limit = 10, categoryLookup = {} } = {}) {
  const payload = data?.data && typeof data.data === 'object' ? data.data : data
  const items = mapApiProductsToRows(
    Array.isArray(payload?.items) ? payload.items : [],
    categoryLookup,
  )
  const pagination = payload?.pagination || {}
  const total = pagination.total ?? items.length
  const resolvedLimit = pagination.limit ?? limit
  const totalPages =
    pagination.totalPages != null
      ? pagination.totalPages
      : total > 0
        ? Math.max(1, Math.ceil(total / resolvedLimit))
        : 0
  const currentPage = pagination.page ?? page

  return {
    items,
    count: items.length,
    total,
    totalPages,
    page: currentPage,
    limit: resolvedLimit,
    hasNextPage: pagination.hasNextPage ?? (totalPages > 0 && currentPage < totalPages),
    hasPrevPage: pagination.hasPrevPage ?? currentPage > 1,
  }
}

export function buildBookstoreListParams(filters = {}) {
  const params = {
    page: filters.page || 1,
    limit: filters.limit || 10,
    search: String(filters.search || '').trim(),
    status: '',
  }

  if (filters.status && filters.status !== 'all') {
    params.status = mapUiStatusToApi(filters.status)
  }

  return params
}

export function mapApiAlertToUi(alert) {
  if (alert === 'OUT_OF_STOCK') return 'Out of stock'
  if (alert === 'LOW_STOCK') return 'Low stock'
  if (alert === 'OK') return 'OK'
  return alert || 'OK'
}

export function mapApiInventoryItemToRow(item, index = 0) {
  if (!item) return null

  return {
    id: item.productId || '',
    mongoId: String(item._id || item.mongoId || ''),
    productId: item.productId || '',
    productName: item.productName || '',
    name: item.productName || '',
    stockQuantity: Number(item.stockQuantity) || 0,
    alert: item.alert || '',
    statusLabel: mapApiAlertToUi(item.alert),
    _index: index,
  }
}

export function mapApiInventoryToRows(items = []) {
  return items
    .map((item, index) => mapApiInventoryItemToRow(item, index))
    .filter(Boolean)
}

export function normalizeBookstoreInventoryListResponse(data, { page = 1, limit = 10 } = {}) {
  const payload = data?.data && typeof data.data === 'object' ? data.data : data
  const items = mapApiInventoryToRows(Array.isArray(payload?.items) ? payload.items : [])
  const pagination = payload?.pagination || {}
  const total = pagination.total ?? items.length
  const resolvedLimit = pagination.limit ?? limit
  const totalPages =
    pagination.totalPages != null
      ? pagination.totalPages
      : total > 0
        ? Math.max(1, Math.ceil(total / resolvedLimit))
        : 0
  const currentPage = pagination.page ?? page

  return {
    items,
    count: items.length,
    total,
    totalPages,
    page: currentPage,
    limit: resolvedLimit,
    hasNextPage: pagination.hasNextPage ?? (totalPages > 0 && currentPage < totalPages),
    hasPrevPage: pagination.hasPrevPage ?? currentPage > 1,
  }
}

export function buildBookstoreInventoryListParams(filters = {}) {
  return {
    page: filters.page || 1,
    limit: filters.limit || 10,
    search: String(filters.search || '').trim(),
  }
}

export function mapApiInventoryViewToRow(item) {
  if (!item) return null

  return {
    id: item.productId || '',
    productId: item.productId || '',
    productName: item.productName || '',
    name: item.productName || '',
    stockQuantity: Number(item.stockQuantity) || 0,
    alert: item.alert || '',
    statusLabel: mapApiAlertToUi(item.alert),
  }
}

export function normalizeBookstoreInventoryViewResponse(body) {
  const data = body?.data && typeof body.data === 'object' ? body.data : body
  return mapApiInventoryViewToRow(data)
}

export function normalizeBookstoreInventorySearchResponse(body) {
  const payload = body?.data && typeof body.data === 'object' ? body.data : body
  const items = mapApiInventoryToRows(Array.isArray(payload?.items) ? payload.items : [])
  return { items }
}

export function formatInventoryActionTypeLabel(actionType) {
  if (actionType === 'RESTOCK') return 'Restock'
  if (actionType === 'MANUAL_ADJUSTMENT') return 'Manual Adjustment'
  return actionType || '—'
}

export function formatInventoryStockChange(value) {
  if (value === null || value === undefined || value === '') return '—'
  const num = Number(value)
  if (!Number.isFinite(num)) return '—'
  if (num > 0) return `+${num}`
  return String(num)
}

export function mapApiInventoryLogItemToRow(item, index = 0) {
  if (!item) return null

  const actionType = item.actionType || ''

  return {
    id: String(item._id || item.id || index),
    mongoId: String(item._id || item.mongoId || ''),
    productId: item.productId || '',
    productName: item.productName || '',
    stockChange: item.stockChange,
    stockAfter: item.stockAfter,
    reason: item.reason || '',
    actionType,
    actionTypeLabel: formatInventoryActionTypeLabel(actionType),
    createdAt: item.createdAt || '',
    _index: index,
  }
}

export function mapApiInventoryLogsToRows(items = []) {
  return items
    .map((item, index) => mapApiInventoryLogItemToRow(item, index))
    .filter(Boolean)
}

export function normalizeBookstoreInventoryLogsResponse(data, { page = 1, limit = 10 } = {}) {
  const payload = data?.data && typeof data.data === 'object' ? data.data : data
  const items = mapApiInventoryLogsToRows(Array.isArray(payload?.items) ? payload.items : [])
  const pagination = payload?.pagination || {}
  const total = pagination.total ?? items.length
  const resolvedLimit = pagination.limit ?? limit
  const totalPages =
    pagination.totalPages != null
      ? pagination.totalPages
      : total > 0
        ? Math.max(1, Math.ceil(total / resolvedLimit))
        : 0
  const currentPage = pagination.page ?? page

  return {
    items,
    count: items.length,
    total,
    totalPages,
    page: currentPage,
    limit: resolvedLimit,
    hasNextPage: pagination.hasNextPage ?? (totalPages > 0 && currentPage < totalPages),
    hasPrevPage: pagination.hasPrevPage ?? currentPage > 1,
  }
}

export function buildBookstoreInventoryLogsParams(filters = {}) {
  const page = Number(filters.page)
  const limit = Number(filters.limit)

  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    limit: Number.isInteger(limit) && limit >= 1 ? limit : 10,
    productId: String(filters.productId ?? '').trim(),
  }
}

export function mapApiAdjustStockProduct(product) {
  if (!product) return null

  return {
    id: product.productId || '',
    productId: product.productId || '',
    productName: product.productName || '',
    name: product.productName || '',
    stockQuantity: Number(product.stockQuantity) || 0,
    alert: product.alert || '',
    statusLabel: mapApiAlertToUi(product.alert),
  }
}

export function normalizeBookstoreAdjustStockResponse(body) {
  const data = body?.data && typeof body.data === 'object' ? body.data : {}

  return {
    success: body?.success === true,
    statusCode: body?.statusCode,
    message: body?.message || 'Stock updated successfully',
    product: mapApiAdjustStockProduct(data.product),
    log: mapApiInventoryLogItemToRow(data.log),
  }
}

export function formFromApiProduct(product) {
  const row = mapApiProductViewToRow(product)
  if (!row) {
    return {
      name: '',
      description: '',
      examCategory: '',
      authorName: '',
      isbn: '',
      originalPrice: '',
      discountPrice: '',
      stockQuantity: '',
      status: 'active',
    }
  }

  return {
    name: row.name,
    description: row.description,
    examCategory: row.examCategoryId || '',
    authorName: row.authorName,
    isbn: row.isbn,
    originalPrice: String(row.originalPrice ?? ''),
    discountPrice: String(row.discountPrice ?? ''),
    stockQuantity: String(row.stockQuantity ?? ''),
    status: row.status,
  }
}

export function buildProductFormData(values, { cover, samplePdf, isDraft } = {}) {
  const formData = new FormData()

  formData.append('productName', String(values.name || '').trim())
  formData.append('examCategoryId', String(values.examCategory || '').trim())
  formData.append('authorName', String(values.authorName || '').trim())
  formData.append('isbn', String(values.isbn || '').trim())
  formData.append('bookSummary', String(values.description || '').trim())
  formData.append('originalPrice', String(Number(values.originalPrice) || 0))

  const discountRaw = String(values.discountPrice ?? '').trim()
  if (discountRaw) {
    formData.append('discountPrice', String(Number(values.discountPrice)))
  }

  const stockQty = parseStockQuantity(values.stockQuantity)

  formData.append(
    'stockQuantity',
    String(Number.isFinite(stockQty) ? stockQty : 0),
  )

  const status = isDraft ? 'DEACTIVATED' : mapUiStatusToApi(values.status || 'active')
  formData.append('status', status)

  if (cover?.file) {
    formData.append('thumbnail', cover.file)
  }

  if (samplePdf?.file) {
    formData.append('previewPdf', samplePdf.file)
  }

  const isFeatured =
    values.isFeaturedOnHomepage === true ||
    values.isFeaturedOnHomepage === 'true' ||
    values.isFeaturedOnHomepage === '1'

  formData.append('isFeaturedOnHomepage', isFeatured ? 'true' : 'false')

  if (isFeatured) {
    formData.append('homepageSortOrder', String(Number(values.homepageSortOrder)))
  }

  const catalogRaw = String(values.catalogSortOrder ?? '').trim()
  if (catalogRaw) {
    formData.append('catalogSortOrder', String(Number(values.catalogSortOrder)))
  }

  return formData
}

export function mapOrderStatusToUi(status) {
  const normalized = String(status || '').toUpperCase()
  const map = {
    PENDING: 'Pending',
    CONFIRMED: 'Confirmed',
    PACKED: 'Packed',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
  }
  return map[normalized] || status || 'Pending'
}

export function mapOrderStatusToApi(status) {
  const map = {
    Pending: 'PENDING',
    Confirmed: 'CONFIRMED',
    Packed: 'PACKED',
    Shipped: 'SHIPPED',
    Delivered: 'DELIVERED',
    Cancelled: 'CANCELLED',
  }
  return map[status] || String(status || '').toUpperCase()
}

export function mapPaymentStatusToUi(status) {
  const normalized = String(status || '').toUpperCase()
  const map = {
    PAID: 'Paid',
    PENDING: 'Pending',
    FAILED: 'Failed',
    REFUNDED: 'REFUNDED',
    REFUND_INITIATED: 'REFUND_INITIATED',
  }
  return map[normalized] || status
}

export function mapRecommendationStatusToUi(status) {
  if (status === 'inactive' || status === 'disabled' || status === 'draft') return 'disabled'
  return status || 'active'
}

export function mapRecommendationStatusToApi(status) {
  if (status === 'disabled' || status === 'draft') return 'inactive'
  return status || 'active'
}

function normalizePaginatedList(payload, { page = 1, limit = 10, mapItem } = {}) {
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  const rawItems = Array.isArray(data?.items) ? data.items : []
  const items = mapItem ? rawItems.map(mapItem).filter(Boolean) : rawItems
  const pagination = data?.pagination || {}
  const total = pagination.total ?? items.length
  const resolvedLimit = pagination.limit ?? limit
  const totalPages =
    pagination.totalPages != null
      ? pagination.totalPages
      : total > 0
        ? Math.max(1, Math.ceil(total / resolvedLimit))
        : 0
  const currentPage = pagination.page ?? page

  return {
    items,
    count: items.length,
    total,
    totalPages,
    page: currentPage,
    limit: resolvedLimit,
    hasNextPage: pagination.hasNextPage ?? (totalPages > 0 && currentPage < totalPages),
    hasPrevPage: pagination.hasPrevPage ?? currentPage > 1,
  }
}

export function mapApiOrderItemToRow(item) {
  if (!item) return null

  return {
    productId: item.productId,
    name: item.productName || item.name || '',
    productName: item.productName || item.name || '',
    qty: item.quantity ?? item.qty ?? 0,
    quantity: item.quantity ?? item.qty ?? 0,
    price: item.unitPrice ?? item.price ?? 0,
    unitPrice: item.unitPrice ?? item.price ?? 0,
    lineTotal: item.lineTotal ?? 0,
  }
}

export function formatOrderBookNames(items = []) {
  const names = (items || [])
    .map((item) => String(item?.productName || item?.name || '').trim())
    .filter(Boolean)

  if (!names.length) return '—'
  return names.join(', ')
}

export function mapApiOrderToRow(order) {
  if (!order) return null

  const items = (order.items || []).map(mapApiOrderItemToRow).filter(Boolean)

  return {
    ...order,
    id: order.orderId || order.id || '',
    orderId: order.orderId || order.id || '',
    status: mapOrderStatusToUi(order.orderStatus || order.status),
    orderStatus: order.orderStatus || mapOrderStatusToApi(order.status),
    paymentStatus: mapPaymentStatusToUi(order.paymentStatus),
    total: order.totalAmount ?? order.total ?? 0,
    totalAmount: order.totalAmount ?? order.total ?? 0,
    paymentGateway: order.paymentGateway || order.gateway || 'Razorpay',
    bookName: formatOrderBookNames(items),
    items,
    mongoId: String(order._id || order.mongoId || ''),
  }
}

export function mapApiPaymentToRow(payment) {
  if (!payment) return null

  const items = (payment.items || []).map(mapApiOrderItemToRow).filter(Boolean)
  const bookName =
    String(payment.bookName || '').trim() ||
    formatOrderBookNames(items) ||
    '—'

  return {
    ...payment,
    id: payment.id || payment.txnId || payment.orderId || '',
    orderId: payment.orderId || '',
    gateway: payment.gateway || payment.paymentGateway || 'Razorpay',
    amount: payment.amount ?? payment.totalAmount ?? 0,
    status: payment.status || mapPaymentStatusToUi(payment.paymentStatus),
    customerName: payment.customerName || '',
    bookName,
    items,
    txnId: payment.txnId || payment.razorpayPaymentId || '',
    createdAt: payment.createdAt || null,
  }
}

export function mapApiInvoiceToRow(invoice) {
  if (!invoice) return null

  const items = (invoice.items || []).map(mapApiOrderItemToRow).filter(Boolean)
  const buyerName =
    String(invoice.buyerName || invoice.customerName || invoice.shippingAddress?.fullName || '')
      .trim() ||
    '—'
  const bookName =
    String(invoice.bookName || '').trim() ||
    formatOrderBookNames(items) ||
    '—'

  return {
    ...invoice,
    id: invoice.id || invoice.invoiceNumber || invoice.orderId || '',
    orderId: invoice.orderId || '',
    buyerName,
    bookName,
    items,
    amount: invoice.amount ?? invoice.totalAmount ?? 0,
    status: invoice.status || invoice.invoiceStatus || 'Generated',
    invoiceUrl: invoice.invoiceUrl || null,
    gstin: invoice.gstin || '',
    createdAt: invoice.createdAt || null,
    invoiceDate: invoice.createdAt || invoice.invoiceDate || null,
  }
}

export function mapApiRecommendationToRow(rule) {
  if (!rule) return null

  return {
    ...rule,
    id: rule.id || rule.recommendationId || '',
    recommendationId: rule.recommendationId || rule.id || '',
    recommendedProductIds: rule.recommendedProductIds || rule.targetProductIds || [],
    targetProductIds: rule.recommendedProductIds || rule.targetProductIds || [],
    status: mapRecommendationStatusToUi(rule.status),
    apiStatus: rule.status || 'active',
    mongoId: String(rule._id || rule.mongoId || ''),
  }
}

export function buildBookstoreCommerceListParams(filters = {}) {
  const params = {
    page: filters.page || 1,
    limit: filters.limit || 100,
    search: String(filters.search || '').trim(),
  }

  if (filters.orderStatus && filters.orderStatus !== 'all') {
    params.orderStatus = mapOrderStatusToApi(filters.orderStatus)
  }

  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    params.paymentStatus = String(filters.paymentStatus).toUpperCase()
  }

  if (filters.status && filters.status !== 'all') {
    params.status = mapRecommendationStatusToApi(filters.status)
  }

  return params
}

export function buildBookstorePaymentAttemptListParams(filters = {}) {
  const params = buildBookstoreCommerceListParams(filters)

  if (filters.failureReason && filters.failureReason !== 'all') {
    params.failureReason = String(filters.failureReason)
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
  }

  if (filters.attemptStatus && filters.attemptStatus !== 'all') {
    params.status = String(filters.attemptStatus).trim().toUpperCase()
  }

  return params
}

export function mapApiBookstorePaymentAttemptToRow(item) {
  if (!item) return null

  return {
    ...item,
    id: item.attemptId || item.id || '',
    student: item.studentName || '',
    mobile: item.mobileNumber || '',
    course: item.bookName || '',
    bookName: item.bookName || '',
    failureCategory: item.failureCategory || item.failureReason || 'Unknown Error',
    lastAttemptDate: item.lastAttemptAt || item.createdAt || null,
    dateTime: item.lastAttemptAt || item.createdAt || null,
  }
}

export function normalizeBookstorePaymentAttemptsListResponse(body, options = {}) {
  return normalizePaginatedList(body, {
    ...options,
    mapItem: mapApiBookstorePaymentAttemptToRow,
  })
}

export function normalizeBookstoreOrdersListResponse(body, options = {}) {
  return normalizePaginatedList(body, {
    ...options,
    mapItem: mapApiOrderToRow,
  })
}

export function normalizeBookstorePaymentsListResponse(body, options = {}) {
  return normalizePaginatedList(body, {
    ...options,
    mapItem: mapApiPaymentToRow,
  })
}

export function normalizeBookstoreInvoicesListResponse(body, options = {}) {
  return normalizePaginatedList(body, {
    ...options,
    mapItem: mapApiInvoiceToRow,
  })
}

export function normalizeBookstoreRecommendationsListResponse(body, options = {}) {
  return normalizePaginatedList(body, {
    ...options,
    mapItem: mapApiRecommendationToRow,
  })
}

export function normalizeBookstoreDashboardResponse(body) {
  const data = body?.data && typeof body.data === 'object' ? body.data : body || {}
  const kpis = data.kpis || {}

  return {
    kpis,
    revenueChart: Array.isArray(data.revenueChart) ? data.revenueChart : [],
    productSalesChart: Array.isArray(data.productSalesChart) ? data.productSalesChart : [],
    orderTrends: Array.isArray(data.orderTrends) ? data.orderTrends : [],
    comboPerformance: Array.isArray(data.comboPerformance) ? data.comboPerformance : [],
    lowStockAlerts: Array.isArray(data.lowStockAlerts) ? data.lowStockAlerts : [],
    bestSellers: Array.isArray(data.bestSellers) ? data.bestSellers : [],
    weekRevenue: data.weekRevenue ?? 0,
    stats: {
      totalRevenue: kpis.revenue ?? 0,
      totalOrders: kpis.totalOrders ?? kpis.booksSold ?? 0,
      totalProducts: kpis.activeProducts ?? 0,
      pendingOrders: kpis.pendingOrders ?? 0,
      deliveredOrders: kpis.deliveredOrders ?? 0,
      lowStockProducts: kpis.lowStockCount ?? 0,
      totalCustomers: kpis.totalCustomers ?? 0,
      monthlyGrowth: kpis.monthlyGrowth ?? 0,
      bestSellingCategory: kpis.bestSellingCategory || '—',
      weekRevenue: data.weekRevenue ?? 0,
      booksSold: kpis.booksSold ?? 0,
    },
    filters: data.filters || {},
  }
}

export function normalizeBookstoreReportsResponse(body) {
  const data = body?.data && typeof body.data === 'object' ? body.data : body || {}
  const summary = data.summary || {}
  const productSales = Array.isArray(data.productSales) ? data.productSales : []
  const dateWise = Array.isArray(data.dateWise) ? data.dateWise : []

  const chartDateWise = dateWise.map((row) => {
    const date = row.date || row.label
    const parsed = date ? new Date(date) : null
    const valid = parsed && !Number.isNaN(parsed.getTime())

    return {
      label: valid
        ? parsed.toLocaleDateString(undefined, { weekday: 'short' })
        : row.label || date || '—',
      day: valid
        ? parsed.toLocaleDateString(undefined, { weekday: 'long' })
        : row.label || date || '—',
      date: date || '',
      amount: row.amount ?? 0,
      orders: row.orders ?? 0,
    }
  })

  return {
    summary: {
      totalBooksSold: summary.totalUnits ?? 0,
      totalRevenue: summary.totalRevenue ?? 0,
      totalOrders: summary.totalOrders ?? 0,
      averageOrderValue: summary.averageOrderValue ?? 0,
      bestSellingBook: productSales[0]?.name || '—',
    },
    productSales,
    dateWise,
    chartDateWise,
  }
}

export function buildRecommendationApiPayload(payload = {}) {
  return {
    sourceProductId: payload.sourceProductId || null,
    recommendationType: payload.recommendationType || 'Cart Recommendations',
    placement: payload.placement || 'Cart Drawer',
    recommendedProductIds: payload.recommendedProductIds || payload.targetProductIds || [],
    bestsellerProductIds: payload.bestsellerProductIds || [],
    priorityOrder: payload.priorityOrder ?? 1,
    status: mapRecommendationStatusToApi(payload.status),
  }
}

export function buildProductUpdateFormData(
  values,
  { cover, samplePdf, isDraft = false, hadPdfInitially } = {},
) {
  const formData = buildProductFormData(values, {
    cover,
    samplePdf,
    isDraft,
  })

  // Product update API does not accept examCategoryId.
  formData.delete('examCategoryId')

  if (!cover?.file && cover?.previewUrl && !cover.previewUrl.startsWith('blob:')) {
    formData.delete('thumbnail')
  }

  if (hadPdfInitially && !samplePdf) {
    formData.append('previewPdfRemove', 'true')
  }

  return formData
}
