import { validateUploadFileSync } from './uploadValidation'

export const BOOKSTORE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp'
export const BOOKSTORE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const BOOKSTORE_MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const BOOKSTORE_MIN_SAMPLE_IMAGES = 3
export const BOOKSTORE_DESCRIPTION_MAX = 3000

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

export function mapKeywordsFromProduct(product) {
  const raw = product?.keywords || []
  if (!Array.isArray(raw)) return []
  return raw.map((text, index) => ({
    id: nextAssetId('kw'),
    text: typeof text === 'string' ? text : String(text?.text ?? ''),
    order: index,
  })).filter((k) => k.text.trim())
}

export function validateProductAssets({ cover, samples, keywords }, { isDraft } = {}) {
  const errors = {}

  if (!isDraft) {
    if (!cover?.previewUrl) {
      errors.cover = 'Book cover thumbnail is required.'
    }
    if (samples.length < BOOKSTORE_MIN_SAMPLE_IMAGES) {
      errors.samples = `Add at least ${BOOKSTORE_MIN_SAMPLE_IMAGES} sample / preview images.`
    }
  }

  const seen = new Set()
  const dupes = []
  keywords.forEach((k) => {
    const key = k.text.trim().toLowerCase()
    if (!key) return
    if (seen.has(key)) dupes.push(k.text)
    seen.add(key)
  })
  if (dupes.length) {
    errors.keywords = `Duplicate keywords: ${dupes.join(', ')}`
  }

  return errors
}

export function buildProductPayload(values, { cover, samples, keywords, isDraft }) {
  return {
    ...values,
    originalPrice: Number(values.originalPrice) || 0,
    discountPrice: Number(values.discountPrice) || 0,
    stockQuantity: Number(values.stockQuantity) || 0,
    thumbnailUrl: cover?.previewUrl || values.thumbnailUrl || '',
    sampleImages: samples.map((s, index) => ({
      url: s.previewUrl,
      order: index,
      fileName: s.fileName,
    })),
    keywords: keywords.map((k) => k.text.trim()).filter(Boolean),
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

export function revokeAssetUrls(assets) {
  assets.forEach((a) => {
    if (a?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(a.previewUrl)
    }
  })
}
