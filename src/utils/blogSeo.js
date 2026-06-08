import { BLOG_DOMAIN_PREVIEW } from './blogSlug.js'

export { BLOG_DOMAIN_PREVIEW }

export const META_TITLE_LIMIT = 60
export const META_DESCRIPTION_LIMIT = 160

export function seoCharCount(text) {
  return (text || '').length
}

export function isOverLimit(text, limit) {
  return seoCharCount(text) > limit
}

export function seoLimitTone(count, limit) {
  if (count > limit) return 'text-amber-600'
  if (count >= limit * 0.9) return 'text-amber-500'
  return 'text-gray-500'
}

export function buildSeoPreviewUrl(slug) {
  const path = slug?.trim() ? slug.trim() : 'blog-url'
  return `${BLOG_DOMAIN_PREVIEW}/blog/${path}`
}
