const STORAGE_KEY = 'sriram_blogs_v3'
const LEGACY_KEYS = ['sriram_blogs_v2', 'sriram_blogs_v1']

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
  const title = overrides.title ?? 'Untitled Blog'
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
      { id: `${id}-s1`, topic: 'Introduction', image: '', imageName: '', content: '' },
    ],
    publishedAt,
    lastSavedAt: overrides.lastSavedAt ?? publishedAt,
    slugManuallyEdited: overrides.slugManuallyEdited ?? false,
    status: normalizeStatus(overrides.status ?? 'published'),
    category: overrides.category ?? 'UPSC',
    language: overrides.language ?? 'English',
    readTime: overrides.readTime ?? '8 min read',
    isMainBlog: Boolean(overrides.isMainBlog),
    youtubeVideoUrl: overrides.youtubeVideoUrl ?? '',
  }
}

export const INITIAL_BLOGS = [
  makeBlog(1, {
    title: 'UPSC Preparation Strategy 2026',
    slug: 'upsc-preparation-strategy-2026',
    category: 'UPSC',
    language: 'English',
    readTime: '8 min read',
    status: 'published',
    isMainBlog: true,
    tags: ['UPSC', 'Strategy', 'Preparation'],
    focusKeywords: ['upsc preparation', 'ias exam strategy'],
    metaDescription:
      'A complete roadmap for UPSC CSE 2026 — prelims, mains, and interview planning for serious aspirants.',
    publishedAt: daysAgo(0),
    backgroundImageName: 'strategy-hero.jpg',
  }),
  makeBlog(2, {
    title: 'Indian Economy Complete Guide',
    slug: 'indian-economy-complete-guide',
    category: 'Economy',
    language: 'English',
    readTime: '12 min read',
    status: 'published',
    isMainBlog: false,
    tags: ['Economy', 'UPSC'],
    publishedAt: daysAgo(1),
    backgroundImageName: 'economy-guide.jpg',
  }),
  makeBlog(3, {
    title: 'Modern Indian History Notes',
    slug: 'modern-indian-history-notes',
    category: 'History',
    language: 'Hindi',
    readTime: '10 min read',
    status: 'draft',
    isMainBlog: false,
    tags: ['History', 'Mains'],
    publishedAt: daysAgo(2),
    backgroundImageName: 'history-notes.jpg',
  }),
  makeBlog(4, {
    title: 'Environment & Ecology Revision',
    slug: 'environment-ecology-revision',
    category: 'Environment',
    language: 'English',
    readTime: '7 min read',
    status: 'published',
    isMainBlog: true,
    tags: ['Environment', 'Prelims'],
    publishedAt: daysAgo(3),
    backgroundImageName: 'environment-revision.jpg',
  }),
  makeBlog(5, {
    title: 'International Relations Simplified',
    slug: 'international-relations-simplified',
    category: 'International Relations',
    language: 'English',
    readTime: '9 min read',
    status: 'published',
    isMainBlog: false,
    tags: ['IR', 'Current Affairs'],
    publishedAt: daysAgo(4),
    backgroundImageName: 'ir-simplified.jpg',
  }),
  makeBlog(6, {
    title: 'Polity Constitution at a Glance',
    slug: 'polity-constitution-at-a-glance',
    category: 'Polity',
    language: 'English',
    readTime: '6 min read',
    status: 'published',
    isMainBlog: false,
    publishedAt: daysAgo(5),
    backgroundImageName: 'polity-glance.jpg',
  }),
  makeBlog(7, {
    title: 'Geography Map-Based Revision',
    slug: 'geography-map-based-revision',
    category: 'Geography',
    language: 'Telugu',
    readTime: '11 min read',
    status: 'published',
    isMainBlog: false,
    publishedAt: daysAgo(6),
    backgroundImageName: 'geography-maps.jpg',
  }),
  makeBlog(8, {
    title: 'Ethics Case Studies Workbook',
    slug: 'ethics-case-studies-workbook',
    category: 'Ethics',
    language: 'English',
    readTime: '15 min read',
    status: 'draft',
    isMainBlog: false,
    publishedAt: daysAgo(7),
    backgroundImageName: 'ethics-workbook.jpg',
  }),
  makeBlog(9, {
    title: 'Science & Technology for Prelims',
    slug: 'science-technology-prelims',
    category: 'Science & Technology',
    language: 'Kannada',
    readTime: '5 min read',
    status: 'published',
    isMainBlog: false,
    publishedAt: daysAgo(8),
    backgroundImageName: 'science-tech.jpg',
  }),
]

export function formatBlogDate(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
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
    category: row.category,
    language: row.language,
    readTime: row.readTime,
    isMainBlog: row.isMainBlog,
    youtubeVideoUrl: row.youtubeVideoUrl,
  })
}

function loadFromLegacy() {
  for (const key of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || parsed.length === 0) continue
      const migrated = parsed.map(migrateBlog).filter(Boolean)
      if (migrated.length) {
        saveBlogs(migrated)
        return migrated
      }
    } catch {
      /* try next key */
    }
  }
  return null
}

export function loadBlogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      const legacy = loadFromLegacy()
      if (legacy) return legacy
      saveBlogs(INITIAL_BLOGS)
      return INITIAL_BLOGS.map(migrateBlog).filter(Boolean)
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveBlogs(INITIAL_BLOGS)
      return INITIAL_BLOGS.map(migrateBlog).filter(Boolean)
    }
    return parsed.map(migrateBlog).filter(Boolean)
  } catch {
    return INITIAL_BLOGS.map(migrateBlog).filter(Boolean)
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
    category: '',
    language: 'English',
    readTime: '',
    isMainBlog: false,
    youtubeVideoUrl: '',
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
