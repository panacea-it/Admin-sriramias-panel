import {
  BookOpen,
  BookOpenCheck,
  ClipboardList,
  Link2,
  Tv,
} from 'lucide-react'

/** Student panel Our Books sidebar image display specs (from free-resources-our-books-slider.css) */
export const OUR_BOOKS_IMAGE_SPECS = {
  displayWidth: 340,
  displayHeight: 305,
  recommendedWidth: 680,
  recommendedHeight: 610,
  minWidth: 340,
  minHeight: 305,
  formats: 'PNG or JPG',
  hint:
    'Upload the full book cover graphic (title and Buy Now are part of the image). Displayed at 340×305px with object-fit: cover.',
  bannerBullets: [
    'Sidebar display: 340×305px (245px height on mobile, up to 305px on desktop)',
    'Recommended upload: 680×610px for sharp rendering',
    'Include title, subtitle, and Buy Now inside the image — no separate title field needed',
  ],
}

/** Student panel Daily Learning card specs (from DailyLearningCard.tsx) */
export const DAILY_LEARNING_IMAGE_SPECS = {
  displayWidth: 320,
  displayHeight: 225,
  recommendedWidth: 640,
  recommendedHeight: 450,
  minWidth: 320,
  minHeight: 225,
  formats: 'PNG or JPG',
  hint:
    'Landscape slide for the Daily Learning carousel. Displayed at 320×225px with object-fit cover and Explore CTA overlay.',
  bannerBullets: [
    'Sidebar display: 320×225px (full card width × fixed 225px height)',
    'Recommended upload: 640×450px for sharp rendering',
    'Use landscape images — Explore button is overlaid on the student panel',
  ],
}

export const COURSES_IMAGE_SPECS = {
  displayWidth: 310,
  displayHeight: 275,
  recommendedWidth: 620,
  recommendedHeight: 550,
  minWidth: 310,
  minHeight: 275,
  formats: 'PNG or JPG',
  hint:
    'Course promo slide for the sidebar carousel. Displayed at ~310×275px with object-fit cover; title and Explore CTA are overlaid on the student panel.',
  bannerBullets: [
    'Sidebar display: ~310×275px (260px height on smaller screens)',
    'Recommended upload: 620×550px for sharp rendering',
    'Course title is entered separately — it appears as overlay text on the student panel',
  ],
}

export const IMAGE_UPLOAD_SECTION_KEYS = ['OUR_BOOKS', 'DAILY_LEARNING', 'COURSES']

export const SECTION_IMAGE_SPECS = {
  OUR_BOOKS: OUR_BOOKS_IMAGE_SPECS,
  DAILY_LEARNING: DAILY_LEARNING_IMAGE_SPECS,
  COURSES: COURSES_IMAGE_SPECS,
}

export const QUICK_LINKS_BASE = '/marketing/quick-links'

export const SIDEBAR_SECTION_KEYS = [
  'OUR_BOOKS',
  'QUICK_LINKS',
  'DAILY_LEARNING',
  'DAILY_QUIZ',
  'COURSES',
  'TRENDING_VIDEOS',
]

export const SECTION_SLUGS = {
  OUR_BOOKS: 'our-books',
  QUICK_LINKS: 'sidebar-quick-links',
  DAILY_LEARNING: 'daily-learning',
  DAILY_QUIZ: 'daily-quiz',
  COURSES: 'courses',
  TRENDING_VIDEOS: 'trending-videos',
}

export const SECTION_ICONS = {
  OUR_BOOKS: BookOpen,
  QUICK_LINKS: Link2,
  DAILY_LEARNING: BookOpenCheck,
  DAILY_QUIZ: ClipboardList,
  COURSES: BookOpen,
  TRENDING_VIDEOS: Tv,
}

export const SIDEBAR_SECTION_LABELS = {
  OUR_BOOKS: 'Our Books',
  QUICK_LINKS: 'Quick Links',
  DAILY_LEARNING: 'Daily Learning',
  DAILY_QUIZ: 'Daily Quiz',
  COURSES: 'Courses',
  TRENDING_VIDEOS: 'Trending Videos',
}

export const SIDEBAR_SECTION_DESCRIPTIONS = {
  OUR_BOOKS: 'Sidebar book cover carousel with Buy Now CTA.',
  QUICK_LINKS: 'Pill-style quick navigation links on Current Affairs pages.',
  DAILY_LEARNING: 'Auto-sliding Daily Learning card with Explore CTA.',
  DAILY_QUIZ: 'Sidebar quiz preview with question, options, and Attempt CTA.',
  COURSES: 'Auto-sliding course promo carousel with Explore CTA.',
  TRENDING_VIDEOS: 'YouTube-style trending video list with View All CTA.',
}

export const QUICK_LINKS_DEFAULT_SLUG = SECTION_SLUGS.OUR_BOOKS

export const QUICK_LINKS_SUBMENU = {
  id: 'quick-links',
  label: 'Quick Links',
  children: SIDEBAR_SECTION_KEYS.map((sectionKey) => ({
    label: SIDEBAR_SECTION_LABELS[sectionKey],
    path: `${QUICK_LINKS_BASE}/${SECTION_SLUGS[sectionKey]}`,
    icon: SECTION_ICONS[sectionKey],
  })),
}

export function normalizeSectionKey(value) {
  return String(value || '').trim().toUpperCase()
}

export function normalizeSectionSlug(value) {
  return String(value || '').trim().toLowerCase()
}

export function getSectionSlug(sectionKey) {
  return SECTION_SLUGS[normalizeSectionKey(sectionKey)] || ''
}

export function getSectionKeyFromSlug(slug) {
  const normalized = normalizeSectionSlug(slug)
  return SIDEBAR_SECTION_KEYS.find((key) => SECTION_SLUGS[key] === normalized) || ''
}

export function isValidSectionKey(value) {
  return SIDEBAR_SECTION_KEYS.includes(normalizeSectionKey(value))
}

export function isValidSectionSlug(value) {
  return Boolean(getSectionKeyFromSlug(value))
}

export function getSidebarSectionLabel(sectionKey) {
  return SIDEBAR_SECTION_LABELS[normalizeSectionKey(sectionKey)] || sectionKey
}

export function quickLinksSectionPath(sectionKey) {
  const slug = getSectionSlug(sectionKey)
  return slug ? `${QUICK_LINKS_BASE}/${slug}` : QUICK_LINKS_BASE
}

export function quickLinksEditPath(sectionKey) {
  return quickLinksSectionPath(sectionKey)
}

export function quickLinksViewPath(sectionKey) {
  return `${quickLinksSectionPath(sectionKey)}/view`
}

export function resolveSectionKeyFromParam(param) {
  const decoded = decodeURIComponent(String(param || ''))
  if (isValidSectionKey(decoded)) return normalizeSectionKey(decoded)
  if (isValidSectionSlug(decoded)) return getSectionKeyFromSlug(decoded)
  return ''
}
