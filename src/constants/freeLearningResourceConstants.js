export const FREE_LEARNING_RESOURCE_TYPES = [
  'DAILY_QUIZ',
  'DAILY_CURRENT_AFFAIRS',
  'DAILY_MAINS_QUESTIONS',
  'BLOGS',
]

export const FREE_LEARNING_RESOURCE_LABELS = {
  DAILY_QUIZ: 'Daily Quiz',
  DAILY_CURRENT_AFFAIRS: 'Daily Current Affairs',
  DAILY_MAINS_QUESTIONS: 'Daily Mains Questions',
  BLOGS: 'Blogs',
}

export const FREE_LEARNING_RESOURCES_BASE = '/marketing/free-learning-resources'

export function getFreeLearningResourceLabel(resourceType) {
  return FREE_LEARNING_RESOURCE_LABELS[resourceType] || resourceType || '—'
}

export function isValidFreeLearningResourceType(resourceType) {
  return FREE_LEARNING_RESOURCE_TYPES.includes(resourceType)
}

export function freeLearningResourceViewPath(resourceType) {
  return `${FREE_LEARNING_RESOURCES_BASE}/view/${encodeURIComponent(resourceType)}`
}

export function freeLearningResourceEditPath(resourceType) {
  return `${FREE_LEARNING_RESOURCES_BASE}/edit/${encodeURIComponent(resourceType)}`
}
