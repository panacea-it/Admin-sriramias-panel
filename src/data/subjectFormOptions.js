import { CATEGORIES_HUB_INITIAL } from './categoriesHubData'
import { LIVE_CLASS_LOCATIONS } from './liveClassesData'

export const SUBJECT_FORM_CATEGORY_OPTIONS = [
  'Live Class',
  'Recording',
  'Hybrid',
  'Workshop',
]

export const SUBJECT_FORM_TOPIC_OPTIONS = CATEGORIES_HUB_INITIAL.topic.map((t) => ({
  id: t.id,
  name: t.name,
  subject: t.subject,
}))

export const SUBJECT_FORM_TEACHER_OPTIONS = CATEGORIES_HUB_INITIAL.teachers.map((t) => ({
  id: t.id,
  name: t.name,
  subject: t.subject,
}))

export const SUBJECT_FORM_CENTER_OPTIONS = LIVE_CLASS_LOCATIONS

export const SUBJECT_FORM_CLASSROOM_OPTIONS = [
  'Room A — Ground Floor',
  'Room B — First Floor',
  'Room C — Second Floor',
  'Hall 1 — Main Block',
  'Hall 2 — Annex',
  'Online — Virtual',
]
