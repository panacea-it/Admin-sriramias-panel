const STORAGE_KEY = 'sriram_blogs_v2'

const SAMPLE_TITLE = 'Why Discipline Beats Motivation Every Time ?'

export const BLOG_TAG_SUGGESTIONS = [
  'UPSC',
  'IAS',
  'Preparation',
  'Strategy',
  'Motivation',
  'Current Affairs',
  'Interview',
  'Optional',
  'Essay',
  'Answer Writing',
]

export const FOCUS_KEYWORD_SUGGESTIONS = [
  'upsc preparation',
  'ias exam',
  'civil services',
  'study plan',
  'mock test',
  'current affairs',
]

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function normalizeStatus(status) {
  if (status === 'published' || status === 'draft') return status
  if (status === 'Active') return 'published'
  return 'draft'
}

function makeBlog(id, overrides = {}) {
  const publishedAt = overrides.publishedAt || new Date().toISOString()
  const title = overrides.title ?? SAMPLE_TITLE
  return {
    id,
    title,
    slug: overrides.slug ?? '',
    metaTitle: overrides.metaTitle ?? title,
    metaDescription: overrides.metaDescription ?? '',
    focusKeywords: Array.isArray(overrides.focusKeywords) ? overrides.focusKeywords : [],
    tags: Array.isArray(overrides.tags) ? overrides.tags : [],
    bodyHtml: overrides.bodyHtml ?? '',
    backgroundImage: overrides.backgroundImage ?? '',
    backgroundImageName: overrides.backgroundImageName ?? '',
    sections: overrides.sections ?? [
      { id: `${id}-s1`, topic: 'Topic 1', image: '', imageName: '', content: '' },
    ],
    publishedAt,
    lastSavedAt: overrides.lastSavedAt ?? publishedAt,
    slugManuallyEdited: overrides.slugManuallyEdited ?? false,
    status: normalizeStatus(overrides.status ?? 'published'),
  }
}

export const INITIAL_BLOGS = [
  makeBlog(1, {
    slug: 'why-discipline-beats-motivation-every-time',
    tags: ['Motivation', 'Strategy'],
    focusKeywords: ['discipline', 'upsc preparation'],
    metaDescription:
      'Learn why consistent discipline outperforms fleeting motivation for long-term UPSC and IAS exam success.',
  }),
  makeBlog(2, { publishedAt: daysAgo(1) }),
  makeBlog(3, { publishedAt: daysAgo(3), status: 'draft' }),
  makeBlog(4),
  makeBlog(5, { status: 'draft' }),
]

export function formatBlogDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatBlogTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatLastSaved(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function isBlogToday(iso) {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

function migrateBlog(row) {
  if (!row || typeof row !== 'object') return null
  return makeBlog(row.id, {
    ...row,
    status: normalizeStatus(row.status),
    focusKeywords: Array.isArray(row.focusKeywords) ? row.focusKeywords : [],
    tags: Array.isArray(row.tags) ? row.tags : [],
    metaTitle: row.metaTitle ?? row.title ?? '',
    metaDescription: row.metaDescription ?? '',
    bodyHtml: row.bodyHtml ?? '',
    slug: row.slug ?? '',
    lastSavedAt: row.lastSavedAt ?? row.publishedAt ?? new Date().toISOString(),
    slugManuallyEdited: Boolean(row.slugManuallyEdited),
    sections: Array.isArray(row.sections) ? row.sections : undefined,
  })
}

export function loadBlogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const legacy = localStorage.getItem('sriram_blogs_v1')
      if (legacy) {
        const parsed = JSON.parse(legacy)
        if (Array.isArray(parsed)) {
          const migrated = parsed.map(migrateBlog).filter(Boolean)
          if (migrated.length) {
            saveBlogs(migrated)
            return migrated
          }
        }
      }
      return INITIAL_BLOGS
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_BLOGS
    return parsed.map(migrateBlog).filter(Boolean)
  } catch {
    return INITIAL_BLOGS
  }
}

export function saveBlogs(blogs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs))
}

export function createEmptyBlog() {
  const id = Date.now()
  const now = new Date().toISOString()
  return {
    id,
    title: '',
    status: 'draft',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    focusKeywords: [],
    tags: [],
    bodyHtml: '',
    backgroundImage: '',
    backgroundImageName: '',
    sections: [{ id: `${id}-s1`, topic: '', image: '', imageName: '', content: '' }],
    publishedAt: now,
    lastSavedAt: now,
    slugManuallyEdited: false,
  }
}

export function createEmptySection(blogId) {
  return {
    id: `${blogId}-s${Date.now()}`,
    topic: '',
    image: '',
    imageName: '',
    content: '',
  }
}

export function collectTagSuggestions(blogs) {
  const set = new Set(BLOG_TAG_SUGGESTIONS)
  for (const b of blogs) {
    for (const t of b.tags || []) {
      if (t?.trim()) set.add(t.trim())
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b))
}
