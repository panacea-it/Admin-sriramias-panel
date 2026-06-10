/** SEO-friendly slug: lowercase, hyphens, alphanumeric only */
export function slugifyTitle(title) {
  if (!title || typeof title !== 'string') return ''
  return title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function isValidSlug(slug) {
  if (!slug) return false
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

export const BLOG_DOMAIN_PREVIEW = 'sriramias.com'
