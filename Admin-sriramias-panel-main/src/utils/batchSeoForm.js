export const BATCH_KEYWORD_SUGGESTIONS = [
  'UPSC',
  'IAS',
  'Civil Services',
  'Prelims',
  'Mains',
  'Interview',
  'General Studies',
  'Current Affairs',
  'Answer Writing',
  'Optional Subject',
]

export const BATCH_TAG_SUGGESTIONS = [
  'Foundation Batch',
  'Live Classes',
  'Recorded Classes',
  'Test Series',
  'Mentorship',
  'Weekend Batch',
  'Delhi',
  'Online',
  'Offline',
  'Hybrid',
]

export const DEFAULT_BATCH_SEO = {
  metaTitle: '',
  metaDescription: '',
  focusKeywords: [],
  tags: [],
  formattedContent: '',
}

export function normalizeBatchSeo(seo = {}) {
  return {
    metaTitle: String(seo.metaTitle || '').trim(),
    metaDescription: String(seo.metaDescription || '').trim(),
    focusKeywords: Array.isArray(seo.focusKeywords)
      ? seo.focusKeywords.map((k) => String(k).trim()).filter(Boolean)
      : [],
    tags: Array.isArray(seo.tags) ? seo.tags.map((t) => String(t).trim()).filter(Boolean) : [],
    formattedContent: String(seo.formattedContent || ''),
  }
}

export function serializeBatchSeo(seo = {}) {
  return normalizeBatchSeo(seo)
}

function slugifyBatchName(name) {
  return (
    String(name || 'batch')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'batch'
  )
}

/** Read-only context from Batch Details (title, course, dates, subjects). */
export function buildBatchSeoContext(form = {}) {
  const linked = Array.isArray(form.linkedSubjects)
    ? form.linkedSubjects.filter((s) => s?.subjectId)
    : []
  return {
    batchName: String(form.batchName || '').trim(),
    courseName: String(form.courseName || '').trim(),
    durationLabel: String(form.durationLabel || '').trim(),
    commencement: form.commencement || '',
    batchStartFrom: form.batchStartFrom || '',
    batchEndTo: form.batchEndTo || '',
    subjectNames: linked.map((s) => s.subjectName).filter(Boolean),
  }
}

/** Search preview falls back to batch title & course — not a separate category. */
export function buildBatchSearchPreview(form = {}, seo = {}) {
  const ctx = buildBatchSeoContext(form)
  const defaultTitle =
    [ctx.batchName, ctx.courseName].filter(Boolean).join(' | ') ||
    'Enter batch name and course in Batch Details'
  const descParts = []
  if (ctx.batchName && ctx.courseName) {
    descParts.push(`${ctx.batchName} — ${ctx.courseName}`)
  } else if (ctx.batchName) {
    descParts.push(ctx.batchName)
  } else if (ctx.courseName) {
    descParts.push(ctx.courseName)
  }
  if (ctx.durationLabel) descParts.push(`Duration: ${ctx.durationLabel}`)
  if (ctx.batchStartFrom && ctx.batchEndTo) {
    descParts.push(`Runs ${ctx.batchStartFrom} to ${ctx.batchEndTo}`)
  }
  if (ctx.subjectNames.length) {
    descParts.push(`Subjects: ${ctx.subjectNames.join(', ')}`)
  }
  const defaultDescription =
    descParts.join(' · ') ||
    'Complete Batch Details above, or enter a meta description below.'

  const metaTitle = String(seo.metaTitle || '').trim()
  const metaDescription = String(seo.metaDescription || '').trim()

  return {
    title: metaTitle || defaultTitle,
    description: metaDescription || defaultDescription,
    url: `sriramias.com/batches/${slugifyBatchName(ctx.batchName)}`,
    titleFromBatch: !metaTitle,
    descriptionFromBatch: !metaDescription,
    context: ctx,
  }
}
