import { generateId } from './contentLibraryStorage'
import { detectContentTypeFromFile } from './contentLibraryTypes'
import { generateSeoSlug } from './contentLibraryAiTagging'

export const EMPTY_CONTENT_FORM = {
  title: '',
  description: '',
  contentType: 'PDF',
  thumbnailFile: null,
  thumbnailPreview: '',
  tags: '',
  keywords: '',
  seoSlug: '',
  estimatedDuration: '',
  difficulty: 'Intermediate',
  subjectIds: [],
  topicIds: [],
  courseIds: [],
  batchIds: [],
  subtopic: '',
  chapter: '',
  categoryId: '',
  files: [],
  externalUrl: '',
  visibility: 'Private',
  access: {
    batchSpecific: false,
    courseSpecific: false,
    paidOnly: false,
    trialUsers: false,
    expiryDate: '',
    downloadEnabled: true,
    streamingOnly: false,
    watermark: false,
    maxDownloads: 0,
  },
  scheduledAt: '',
  notifyOnPublish: true,
  dependencies: [],
}

export function contentItemToForm(item) {
  if (!item) return { ...EMPTY_CONTENT_FORM }
  return {
    ...EMPTY_CONTENT_FORM,
    title: item.title || '',
    description: item.description || '',
    contentType: item.contentType || 'PDF',
    thumbnailPreview: item.thumbnailUrl || '',
    tags: (item.tags || []).join(', '),
    keywords: (item.keywords || []).join(', '),
    seoSlug: item.seoSlug || '',
    estimatedDuration: item.estimatedDuration || '',
    difficulty: item.difficulty || 'Intermediate',
    subjectIds: item.subjectIds || [],
    topicIds: item.topicIds || [],
    courseIds: item.courseIds || [],
    batchIds: item.batchIds || [],
    subtopic: item.subtopic || '',
    chapter: item.chapter || '',
    categoryId: item.categoryId || '',
    files: item.files || [],
    externalUrl: item.externalUrl || '',
    visibility: item.visibility || 'Private',
    access: { ...EMPTY_CONTENT_FORM.access, ...item.access },
    scheduledAt: item.scheduledAt || '',
    notifyOnPublish: item.notifyOnPublish !== false,
    dependencies: item.dependencies || [],
  }
}

export function formToContentItem(form, existing = null, meta = {}) {
  const now = new Date().toISOString()
  const tags = String(form.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const keywords = String(form.keywords || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  const files = (form.files || []).map((f) => ({
    id: f.id || generateId('file'),
    name: f.name,
    size: f.size || 0,
    mimeType: f.mimeType || '',
    url: f.url || f.preview || '',
  }))

  return {
    id: existing?.id || generateId('cnt'),
    title: form.title.trim(),
    description: form.description?.trim() || '',
    contentType: form.contentType,
    thumbnailUrl: form.thumbnailPreview || existing?.thumbnailUrl || '',
    tags,
    keywords,
    seoSlug: form.seoSlug?.trim() || generateSeoSlug(form.title),
    estimatedDuration: form.estimatedDuration || '',
    difficulty: form.difficulty,
    subjectIds: form.subjectIds || [],
    topicIds: form.topicIds || [],
    courseIds: form.courseIds || [],
    batchIds: form.batchIds || [],
    subtopic: form.subtopic || '',
    chapter: form.chapter || '',
    files,
    visibility: form.visibility,
    access: { ...EMPTY_CONTENT_FORM.access, ...form.access },
    status: meta.status || existing?.status || 'Draft',
    uploadedBy: existing?.uploadedBy || meta.uploadedBy || 'Admin User',
    uploadedAt: existing?.uploadedAt || now,
    publishedAt: meta.publishedAt ?? existing?.publishedAt ?? '',
    scheduledAt: form.scheduledAt || '',
    views: existing?.views ?? 0,
    downloads: existing?.downloads ?? 0,
    categoryId: form.categoryId || '',
    approvalStatus: meta.approvalStatus || existing?.approvalStatus || 'approved',
    version: existing?.version || 1,
    externalUrl: form.externalUrl?.trim() || '',
    dependencies: form.dependencies || [],
    notifyOnPublish: form.notifyOnPublish !== false,
    deletedAt: existing?.deletedAt ?? null,
    recycleExpiresAt: existing?.recycleExpiresAt ?? null,
  }
}

export function mapUploadedFiles(fileList = []) {
  return Array.from(fileList).map((file) => ({
    id: generateId('file'),
    name: file.name,
    size: file.size,
    mimeType: file.type,
    url: URL.createObjectURL(file),
    file,
    contentType: detectContentTypeFromFile(file),
  }))
}
