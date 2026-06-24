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
