export const PLACEHOLDER_IMAGE_LABEL = '312×214 Kb'

export function isResolvableRankerImageUrl(imageUrl) {
  if (!imageUrl || typeof imageUrl !== 'string') return false
  const trimmed = imageUrl.trim()
  if (!trimmed || trimmed === PLACEHOLDER_IMAGE_LABEL) return false
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  )
}

export function cloudinaryUrlHasTransformations(url) {
  if (!url || typeof url !== 'string') return false
  const match = url.match(/\/upload\/([^/]+)\//)
  if (!match) return false
  return !/^v\d+$/.test(match[1])
}

export function resolveRankerImagePreviewSrc(imageUrl) {
  if (!isResolvableRankerImageUrl(imageUrl)) return ''
  return optimizeRankerImageUrl(imageUrl.trim())
}

function buildTopperCloudinaryTransform({ width, height }) {
  return `c_limit,h_${height},w_${width},f_auto,fl_preserve_transparency,q_auto:best`
}

/** Scale CMS topper photos without cropping — preserve alpha without forced PNG re-encode. */
export function optimizeRankerImageUrl(url, { width = 1536, height = 1104 } = {}) {
  if (!url || typeof url !== 'string') return url
  const trimmed = url.trim()
  if (!trimmed.includes('res.cloudinary.com') || !trimmed.includes('/upload/')) {
    return trimmed
  }

  const uploadSegment = trimmed.match(/\/upload\/([^/]+)\//)?.[1]
  if (uploadSegment && !/^v\d+$/.test(uploadSegment)) {
    return trimmed
  }

  return trimmed.replace(
    '/upload/',
    `/upload/${buildTopperCloudinaryTransform({ width, height })}/`,
  )
}

/** Crisp thumbnail for admin table cells — scale only, keep transparency. */
export function optimizeRankerThumbnailUrl(url, size = 128) {
  if (!url || typeof url !== 'string') return url
  const trimmed = url.trim()
  if (!trimmed.includes('res.cloudinary.com') || !trimmed.includes('/upload/')) {
    return trimmed
  }

  const uploadSegment = trimmed.match(/\/upload\/([^/]+)\//)?.[1]
  if (uploadSegment && !/^v\d+$/.test(uploadSegment)) {
    return trimmed
  }

  const dimension = size * 2
  return trimmed.replace(
    '/upload/',
    `/upload/${buildTopperCloudinaryTransform({ width: dimension, height: dimension })}/`,
  )
}
