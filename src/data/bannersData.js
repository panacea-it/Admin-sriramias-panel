export const BANNER_CATEGORIES = [
  'GS Foundation',
  'Mentorship Course',
  'Optional Foundation',
  'Test Series',
  'Enrichment Courses',
]

export const BANNER_CENTERS = ['New Delhi', 'Hyderabad', 'Pune']

export const BANNER_STATUSES = ['Active', 'In Active']

const STORAGE_KEY = 'sriram_banners_v1'

const COURSE_NAMES = [
  '2 Year General Studies Foundation Course',
  'STRIDE Mentorship Program',
  'Anthropology Optional Foundation Course',
  'CSAT Foundation Course',
  'Geography Optional Foundation Course',
  'Ethics & Integrity Module',
  'History Optional Foundation Course',
  'Public Administration Optional',
  'Prelims Test Series 2026',
  'Mains Answer Writing Program',
  'Current Affairs Enrichment Batch',
  'Essay Writing Workshop',
  'Science & Tech Module',
  'Polity Foundation Course',
  'Economy for UPSC Foundation',
  'Environment & Ecology Crash Course',
  'International Relations Module',
  'Ethics Case Studies Batch',
  'Interview Guidance Program',
  'Delhi Weekend GS Batch',
  'Hyderabad Foundation Weekend',
  'Pune Mentorship Cohort',
  'Law Optional Foundation',
  'Philosophy Optional Batch',
  'Sociology Optional Foundation',
]

export const BANNER_COURSE_OPTIONS = COURSE_NAMES

function normalizeStatus(status) {
  if (status === 'Inactive' || status === 'InActive') return 'In Active'
  if (status === 'In Active' || status === 'Active') return status
  return status === 'Active' ? 'Active' : 'In Active'
}

function migrateBanner(row) {
  if (!row || typeof row !== 'object') return null
  const hasImage = Boolean(row.imageUrl) || Boolean(row.hasThumbnail)
  return {
    id: row.id,
    course: String(row.course ?? '').trim(),
    category: row.category ?? BANNER_CATEGORIES[0],
    center: row.center ?? BANNER_CENTERS[0],
    status: normalizeStatus(row.status),
    imageUrl: row.imageUrl ?? '',
    imageFileName: row.imageFileName ?? '',
    hasThumbnail: hasImage,
    updatedAt: row.updatedAt ?? new Date().toISOString(),
  }
}

export const INITIAL_BANNERS = COURSE_NAMES.map((course, index) => ({
  id: 54546 + index,
  course,
  category: BANNER_CATEGORIES[index % BANNER_CATEGORIES.length],
  center: BANNER_CENTERS[index % BANNER_CENTERS.length],
  status: index % 7 === 0 ? 'In Active' : 'Active',
  hasThumbnail: index % 4 !== 2,
  imageUrl: '',
  imageFileName: '',
  updatedAt: new Date().toISOString(),
}))

export function getBannerImageSrc(banner) {
  if (!banner) return null
  if (banner.imageUrl) return banner.imageUrl
  if (banner.hasThumbnail) {
    const seed = encodeURIComponent(String(banner.id ?? banner.course ?? 'banner').slice(0, 32))
    return `https://picsum.photos/seed/${seed}/960/540`
  }
  return null
}

export function loadBanners() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_BANNERS.map(migrateBanner).filter(Boolean)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return INITIAL_BANNERS.map(migrateBanner).filter(Boolean)
    }
    return parsed.map(migrateBanner).filter(Boolean)
  } catch {
    return INITIAL_BANNERS.map(migrateBanner).filter(Boolean)
  }
}

export function saveBanners(banners) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(banners))
}

export function nextBannerId(list) {
  const max = list.reduce((acc, row) => Math.max(acc, Number(row.id) || 0), 54545)
  return max + 1
}
