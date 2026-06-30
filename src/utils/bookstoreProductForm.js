import { validateUploadFileSync } from './uploadValidation'

export const BOOKSTORE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
export const BOOKSTORE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const BOOKSTORE_MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const BOOKSTORE_MIN_SAMPLE_IMAGES = 3
export const BOOKSTORE_DESCRIPTION_MAX = 3000

export function parseStockQuantity(value) {
  const parsed = parseInt(String(value ?? '').trim(), 10)
  return Number.isFinite(parsed) ? parsed : NaN
}

export function getProductExamCategory(product) {
  return product?.examCategory ?? product?.subject ?? ''
}

export function withLegacyOption(options, value) {
  if (!value || options.includes(value)) return options
  return [value, ...options]
}

let assetSeq = 0
export function nextAssetId(prefix = 'asset') {
  assetSeq += 1
  return `${prefix}-${Date.now()}-${assetSeq}`
}

export function isAllowedImage(file) {
  if (!file) return false
  return validateUploadFileSync(file, 'IMAGE_STANDARD').valid
}

export function createCoverAsset(file, existingUrl = '') {
  if (file) {
    return {
      id: nextAssetId('cover'),
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      progress: 0,
      uploading: true,
    }
  }
  if (existingUrl) {
    return {
      id: nextAssetId('cover'),
      file: null,
      previewUrl: existingUrl,
      fileName: 'Existing cover',
      progress: 100,
      uploading: false,
    }
  }
  return null
}

export function createPdfAsset(file, existingUrl = '', existingFileName = '') {
  if (file) {
    return {
      id: nextAssetId('pdf'),
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      progress: 0,
      uploading: true,
    }
  }
  if (existingUrl) {
    return {
      id: nextAssetId('pdf'),
      file: null,
      previewUrl: existingUrl,
      fileName: existingFileName || 'Sample PDF',
      progress: 100,
      uploading: false,
    }
  }
  return null
}

export function mapPdfFromProduct(product) {
  const url = product?.previewPdf || ''
  if (!url) return null
  return createPdfAsset(null, url, product?.previewPdfFileName || 'Sample PDF')
}

export function createSampleAsset(file, existingUrl = '') {
  if (file) {
    return {
      id: nextAssetId('sample'),
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      progress: 0,
      uploading: true,
    }
  }
  if (existingUrl) {
    return {
      id: nextAssetId('sample'),
      file: null,
      previewUrl: existingUrl,
      fileName: 'Sample image',
      progress: 100,
      uploading: false,
    }
  }
  return null
}

export function mapSampleImagesFromProduct(product) {
  const urls = product?.sampleImages || product?.previewImages || []
  if (!Array.isArray(urls)) return []
  return urls
    .map((entry) => {
      const url = typeof entry === 'string' ? entry : entry?.url
      if (!url) return null
      return createSampleAsset(null, url)
    })
    .filter(Boolean)
}

function normalizeIsbn(value) {
  return String(value || '').replace(/[-\s]/g, '')
}

export function validateIsbn(value) {
  const normalized = normalizeIsbn(value)
  if (!normalized) return 'ISBN is required.'
  if (!/^\d{10}(\d{3})?$/.test(normalized)) {
    return 'Enter a valid ISBN-10 or ISBN-13.'
  }
  return ''
}

export function validateProductForm(values, { cover, isDraft, isEdit } = {}) {
  const errors = {}

  if (!String(values.name || '').trim()) {
    errors.name = 'Product name is required.'
  }

  if (!String(values.authorName || '').trim()) {
    errors.authorName = 'Author name is required.'
  }

  const isbnError = validateIsbn(values.isbn)
  if (isbnError) errors.isbn = isbnError

  if (!String(values.description || '').trim()) {
    errors.description = 'Book summary is required.'
  }

  const originalPrice = Number(values.originalPrice)
  if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
    errors.originalPrice = 'Original price must be greater than 0.'
  }

  const discountRaw = String(values.discountPrice ?? '').trim()
  if (discountRaw) {
    const discountPrice = Number(discountRaw)
    if (!Number.isFinite(discountPrice) || discountPrice < 0) {
      errors.discountPrice = 'Discounted price cannot be negative.'
    } else if (Number.isFinite(originalPrice) && discountPrice > originalPrice) {
      errors.discountPrice = 'Discounted price cannot exceed original price.'
    }
  }

  const stockQuantity = parseStockQuantity(values.stockQuantity)
  if (!Number.isFinite(stockQuantity) || stockQuantity < 0) {
    errors.stockQuantity = 'Stock quantity must be a non-negative whole number.'
  }

  if (!values.status) {
    errors.status = 'Status is required.'
  }

  if (!isDraft && !cover?.previewUrl) {
    errors.cover = 'Thumbnail image is required.'
  }

  if (!isDraft && !isEdit && !cover?.file) {
    errors.cover = 'Upload a thumbnail image before creating the product.'
  }

  const isFeatured =
    values.isFeaturedOnHomepage === true ||
    values.isFeaturedOnHomepage === 'true' ||
    values.isFeaturedOnHomepage === '1'

  const effectiveStatus = isDraft ? 'DEACTIVATED' : (values.status === 'active' ? 'ACTIVE' : 'DEACTIVATED')

  if (isFeatured) {
    if (effectiveStatus !== 'ACTIVE') {
      errors.isFeaturedOnHomepage =
        'Only ACTIVE products can be featured on the homepage. Set status to ACTIVE before featuring.'
    }

    const homepageOrder = Number(values.homepageSortOrder)
    if (!Number.isFinite(homepageOrder) || !Number.isInteger(homepageOrder) || homepageOrder < 1) {
      errors.homepageSortOrder =
        'Homepage display order is required and must be at least 1 when Show on Homepage is enabled.'
    }
  } else {
    const homepageRaw = String(values.homepageSortOrder ?? '').trim()
    if (homepageRaw) {
      errors.homepageSortOrder =
        'Homepage display order cannot be set when Show on Homepage is disabled.'
    }
  }

  const catalogRaw = String(values.catalogSortOrder ?? '').trim()
  if (catalogRaw) {
    const catalogOrder = Number(catalogRaw)
    if (!Number.isFinite(catalogOrder) || !Number.isInteger(catalogOrder) || catalogOrder < 1) {
      errors.catalogSortOrder = 'Catalog sort order must be a whole number of at least 1.'
    }
  }

  return errors
}

export function buildProductPayload(values, { cover, samplePdf, isDraft }) {
  const { productType: _productType, subject: _subject, ...rest } = values
  const stockQty = parseStockQuantity(values.stockQuantity)

  return {
    ...rest,
    examCategory: values.examCategory,
    subject: values.examCategory,
    originalPrice: Number(values.originalPrice) || 0,
    discountPrice: Number(values.discountPrice) || 0,
    stockQuantity: Number.isFinite(stockQty) ? stockQty : 0,
    thumbnailUrl: cover?.previewUrl || values.thumbnailUrl || '',
    previewPdf: samplePdf?.previewUrl || values.previewPdf || '',
    previewPdfFileName: samplePdf?.fileName || values.previewPdfFileName || '',
    publishState: isDraft ? 'draft' : 'published',
    status: isDraft ? 'inactive' : values.status,
  }
}

export function runListUploadProgress(setAssets, ids) {
  const tick = () => {
    setAssets((prev) =>
      prev.map((item) => {
        if (!ids.includes(item.id) || !item.uploading) return item
        const next = Math.min(100, item.progress + 18 + Math.random() * 12)
        return { ...item, progress: next, uploading: next < 100 }
      }),
    )
  }
  const interval = setInterval(tick, 120)
  const timeout = setTimeout(() => {
    clearInterval(interval)
    setAssets((prev) =>
      prev.map((item) =>
        ids.includes(item.id) ? { ...item, progress: 100, uploading: false } : item,
      ),
    )
  }, 900)
  return () => {
    clearInterval(interval)
    clearTimeout(timeout)
  }
}

export function runCoverUploadProgress(setCover, id) {
  const tick = () => {
    setCover((prev) => {
      if (!prev || prev.id !== id || !prev.uploading) return prev
      const next = Math.min(100, prev.progress + 18 + Math.random() * 12)
      return { ...prev, progress: next, uploading: next < 100 }
    })
  }
  const interval = setInterval(tick, 120)
  const timeout = setTimeout(() => {
    clearInterval(interval)
    setCover((prev) =>
      prev && prev.id === id ? { ...prev, progress: 100, uploading: false } : prev,
    )
  }, 900)
  return () => {
    clearInterval(interval)
    clearTimeout(timeout)
  }
}

export function runPdfUploadProgress(setSamplePdf, id) {
  const tick = () => {
    setSamplePdf((prev) => {
      if (!prev || prev.id !== id || !prev.uploading) return prev
      const next = Math.min(100, prev.progress + 14 + Math.random() * 10)
      return { ...prev, progress: next, uploading: next < 100 }
    })
  }
  const interval = setInterval(tick, 140)
  const timeout = setTimeout(() => {
    clearInterval(interval)
    setSamplePdf((prev) =>
      prev && prev.id === id ? { ...prev, progress: 100, uploading: false } : prev,
    )
  }, 1200)
  return () => {
    clearInterval(interval)
    clearTimeout(timeout)
  }
}

export function revokeAssetUrls(assets) {
  assets.forEach((a) => {
    if (a?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(a.previewUrl)
    }
  })
}
