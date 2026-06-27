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
    originalPrice: Number(item.originalPrice) || Number(item.discountPrice) || 0,
    discountPrice: Number(item.discountPrice) || 0,
    stockQuantity: Number(item.stockQuantity) || 0,
    thumbnailUrl: item.thumbnailUrl || item.thumbnail || '',
    status: mapApiStatusToUi(item.status),
    apiStatus: item.status || '',
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
    language: item.language || 'English',
    keywords: Array.isArray(item.seoKeywords) ? item.seoKeywords : item.keywords || [],
    previewImages: Array.isArray(item.previewImages)
      ? item.previewImages
      : item.sampleImages || [],
    previewPdf: item.previewPdf || null,
    previewPdfFileName: item.previewPdfFileName || null,
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

  return {
    success: body?.success === true,
    statusCode: body?.statusCode,
    message: body?.message || 'Product status updated successfully',
    productId: data.productId || '',
    mongoId: String(data._id || ''),
    status: data.status || '',
    apiStatus: data.status || '',
    uiStatus: mapApiStatusToUi(data.status),
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

export function mapApiInventoryLogItemToRow(item, index = 0) {
  if (!item) return null

  return {
    id: String(item._id || item.id || index),
    mongoId: String(item._id || item.mongoId || ''),
    productId: item.productId || '',
    productName: item.productName || '',
    stockChange: item.stockChange,
    stockAfter: item.stockAfter,
    reason: item.reason || '',
    actionType: item.actionType || '',
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
  return {
    page: filters.page || 1,
    limit: filters.limit || 10,
    productId: String(filters.productId || '').trim(),
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

export function buildProductFormData(values, { cover, samples, keywords, isDraft } = {}) {
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

  formData.append('stockQuantity', String(Number(values.stockQuantity) || 0))

  const status = isDraft ? 'DEACTIVATED' : mapUiStatusToApi(values.status || 'active')
  formData.append('status', status)

  const keywordList = (keywords || [])
    .map((entry) => (typeof entry === 'string' ? entry : entry?.text || ''))
    .map((text) => text.trim())
    .filter(Boolean)

  if (keywordList.length) {
    formData.append('seoKeywords', JSON.stringify(keywordList))
  }

  if (cover?.file) {
    formData.append('thumbnail', cover.file)
  }

  const existingPreviewUrls = []
  ;(samples || []).forEach((sample) => {
    if (sample?.file) {
      formData.append('previewImages', sample.file)
      return
    }

    const url = sample?.previewUrl
    if (url && !url.startsWith('blob:')) {
      existingPreviewUrls.push(url)
    }
  })

  if (existingPreviewUrls.length) {
    formData.append('existingPreviewImages', JSON.stringify(existingPreviewUrls))
  }

  return formData
}

export function buildProductUpdateFormData(values, { cover, samples, keywords, isDraft } = {}) {
  const formData = buildProductFormData(values, { cover, samples, keywords, isDraft })

  if (!cover?.file && cover?.previewUrl && !cover.previewUrl.startsWith('blob:')) {
    formData.delete('thumbnail')
  }

  return formData
}
