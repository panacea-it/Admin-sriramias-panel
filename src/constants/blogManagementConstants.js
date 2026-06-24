export const BLOG_TABLE_CATEGORIES = [
  'UPSC',
  'Economy',
  'History',
  'Geography',
  'Polity',
  'Environment',
  'Ethics',
  'International Relations',
  'Science & Technology',
]

export const BLOG_FORM_CATEGORIES = [
  'Economy',
  'Polity',
  'History',
  'Geography',
  'Ethics',
  'Environment',
  'Current Affairs',
  'UPSC',
  'International Relations',
  'Science & Technology',
]

export const BLOG_LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'Hindi' },
  { value: 'Telugu', label: 'Telugu' },
  { value: 'Tamil', label: 'Tamil' },
  { value: 'Kannada', label: 'Kannada' },
]

export const BLOG_READ_TIMES = [
  '5 min read',
  '6 min read',
  '7 min read',
  '8 min read',
  '9 min read',
  '10 min read',
  '12 min read',
  '15 min read',
]

export function isBlogActive(status) {
  return status === 'published'
}

export function blogStatusLabel(status) {
  return isBlogActive(status) ? 'Active' : 'Deactivated'
}

export function toggleBlogStatus(status) {
  return isBlogActive(status) ? 'draft' : 'published'
}
