import { isBlogActive } from '../constants/blogManagementConstants'

export const BLOG_API_SUCCESS_CODE = 10000

export function isBlogApiSuccess(response) {
  if (!response || response.success !== true) return false
  if (response.statusCode == null) return true
  return response.statusCode === BLOG_API_SUCCESS_CODE
}

function formatDateFields(isoValue) {
  const value = isoValue ? new Date(isoValue) : null
  if (!value || Number.isNaN(value.getTime())) {
    return { time: '—', date: '—', iso: null }
  }

  return {
    iso: value.toISOString(),
    time: value.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    date: value.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }
}

export function mapApiStatusToUi(status) {
  if (status === 'ACTIVE' || status === true) return 'published'
  if (status === 'INACTIVE' || status === false) return 'draft'
  return normalizeUiStatus(status)
}

export function mapUiStatusToApi(status) {
  if (status === 'published') return 'ACTIVE'
  if (status === 'draft') return 'INACTIVE'
  return status
}

function normalizeUiStatus(status) {
  if (status === 'published' || status === 'draft') return status
  if (status === 'Active' || status === 'ACTIVE') return 'published'
  return 'draft'
}

export function normalizeBlogDropdownOption(option) {
  if (!option || typeof option !== 'object') return null
  const label = String(option.label ?? option.languageName ?? option.value ?? '').trim()
  const value = String(option.value ?? option.languageId ?? option.label ?? '').trim()
  if (!label || !value) return null
  return { label, value }
}

export function normalizeBlogLanguageOption(option) {
  if (!option || typeof option !== 'object') return null
  const languageId = String(option.languageId ?? option.value ?? '').trim()
  const languageName = String(option.languageName ?? option.label ?? '').trim()
  if (!languageId || !languageName) return null
  return { languageId, languageName, label: languageName, value: languageId }
}

export function buildBlogLanguageLookup(languages = []) {
  const byId = {}
  const byName = {}

  for (const item of languages) {
    const normalized = normalizeBlogLanguageOption(item)
    if (!normalized) continue
    byId[normalized.languageId] = normalized
    byName[normalized.languageName.toLowerCase()] = normalized
  }

  return { byId, byName }
}

export function resolveBlogLanguageId(blog, languageLookup = {}) {
  if (blog?.languageId) return String(blog.languageId)
  const fromName = blog?.language
    ? languageLookup.byName?.[String(blog.language).trim().toLowerCase()]
    : null
  return fromName?.languageId || ''
}

export function resolveBlogLanguageName(blog, languageLookup = {}) {
  if (blog?.language && !blog?.languageId) return blog.language
  const match = blog?.languageId ? languageLookup.byId?.[blog.languageId] : null
  return match?.languageName || blog?.languageName || blog?.language || ''
}

export function normalizeBlogDropdownList(data) {
  return (Array.isArray(data) ? data : [])
    .map((item) => normalizeBlogDropdownOption(item))
    .filter(Boolean)
}

export function normalizeBlogLanguageList(data) {
  return (Array.isArray(data) ? data : [])
    .map((item) => normalizeBlogLanguageOption(item))
    .filter(Boolean)
}

export function mapApiBlogToRow(item, index = 0, languageLookup = {}) {
  if (!item) return null

  const published = formatDateFields(item.publishedAt || item.date || item.createdAt)
  const languageId =
    item.language?.languageId ||
    resolveBlogLanguageId(item, languageLookup)
  const languageName =
    item.languageName ||
    item.language?.languageName ||
    resolveBlogLanguageName({ ...item, languageId }, languageLookup)

  const backgroundImage =
    typeof item.backgroundImage === 'string'
      ? item.backgroundImage
      : item.backgroundImage?.url || item.thumbnail?.url || item.thumbnailUrl || ''

  const tableSections = Array.isArray(item.tableOfContents)
    ? item.tableOfContents
    : Array.isArray(item.sections)
      ? item.sections
      : Array.isArray(item.contents)
        ? item.contents
        : []

  const sortedSections = [...tableSections].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  )

  const searchPreview = item.searchPreview || {}

  return {
    id: item._id || item.id || item.blogId || `blog-${index}`,
    mongoId: String(item._id || item.id || ''),
    blogId: item.blogId || '',
    title: item.title || '',
    slug: item.slug || '',
    metaTitle: item.metaTitle || item.title || '',
    metaDescription: item.metaDescription || item.description || '',
    focusKeywords: Array.isArray(item.focusKeywords) ? item.focusKeywords : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    bodyHtml: item.bodyHtml || item.content || '',
    backgroundImage,
    backgroundImageName:
      item.backgroundImageName ||
      (backgroundImage ? backgroundImage.split('/').pop()?.split('?')[0] : '') ||
      '',
    sections: sortedSections.map((section, sectionIndex) => {
      const imageValue =
        typeof section.image === 'string'
          ? section.image
          : section.image?.url || section.imageUrl || ''

      return {
        id: section._id || `${item._id || item.blogId || index}-s${sectionIndex + 1}`,
        order: section.order ?? sectionIndex + 1,
        topic: section.topic || section.title || '',
        image: imageValue,
        imageName:
          section.imageName ||
          (imageValue ? imageValue.split('/').pop()?.split('?')[0] : '') ||
          '',
        content: section.content || '',
      }
    }),
    searchPreview: {
      title: searchPreview.title || '',
      url: searchPreview.url || '',
      description: searchPreview.description || '',
    },
    publishedAt: published.iso || item.createdAt || new Date().toISOString(),
    lastSavedAt: item.updatedAt || item.lastSavedAt || published.iso || new Date().toISOString(),
    slugManuallyEdited: Boolean(item.slugManuallyEdited || item.slug),
    status: mapApiStatusToUi(item.status ?? item.isActive),
    listStatus: item.status != null ? String(item.status) : '',
    category: item.category || item.paper || item.paperName || '',
    languageId,
    language: languageName,
    readTime: item.readTime || '',
    isMainBlog: Boolean(item.isMainBlog),
    youtubeVideoUrl: item.youtubeVideoUrl || item.youtubeUrl || '',
  }
}

export function mapApiBlogListItemToRow(item, index = 0) {
  if (!item) return null

  const rawStatus = item.status != null ? String(item.status) : ''

  return {
    id: item._id || item.id || item.blogId || `blog-${index}`,
    mongoId: String(item._id || item.id || ''),
    blogId: item.blogId || '',
    title: item.title || '',
    category: item.category || '',
    listDate: item.date || '—',
    listTime: item.time || '—',
    listStatus: rawStatus,
    mainBlogLabel: item.isMainBlog ? 'Yes' : 'No',
    isMainBlog: Boolean(item.isMainBlog),
    status: mapApiStatusToUi(item.status ?? item.isActive),
    slug: item.slug || '',
    publishedAt: item.publishedAt || item.createdAt || new Date().toISOString(),
    lastSavedAt: item.updatedAt || item.lastSavedAt || item.publishedAt || item.createdAt || '',
  }
}

export function applyBlogStatusUpdateToRow(existingRow, apiData) {
  if (!existingRow || !apiData) return existingRow

  const patch = mapApiBlogListItemToRow({ ...existingRow, ...apiData })
  if (!patch) return existingRow

  return {
    ...existingRow,
    ...patch,
    listDate: existingRow.listDate,
    listTime: existingRow.listTime,
    lastSavedAt: apiData.updatedAt || patch.lastSavedAt || existingRow.lastSavedAt,
  }
}

export function applyBlogMainUpdateToRow(existingRow, apiData) {
  if (!existingRow || !apiData) return existingRow

  const isMainBlog = Boolean(apiData.isMainBlog)

  return {
    ...existingRow,
    isMainBlog,
    mainBlogLabel: isMainBlog ? 'Yes' : 'No',
    lastSavedAt: apiData.updatedAt || existingRow.lastSavedAt,
  }
}

export function normalizeBlogListResponse(response, languageLookup = {}) {
  const payload = response?.data
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : []

  const rows = items
    .map((item, index) => mapApiBlogListItemToRow(item, index))
    .filter(Boolean)

  const page = payload?.page ?? 1
  const limit = (payload?.limit ?? rows.length) || 10
  const total = payload?.total ?? payload?.count ?? rows.length
  const totalPages = payload?.totalPages ?? (limit > 0 ? Math.ceil(total / limit) || 1 : 1)

  const pagination = payload?.pagination || {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: payload?.hasNextPage ?? page < totalPages,
    hasPrevPage: payload?.hasPrevPage ?? page > 1,
  }

  return {
    items: rows,
    total: pagination.total ?? total,
    page: pagination.page ?? page,
    limit: pagination.limit ?? limit,
    totalPages: pagination.totalPages ?? totalPages,
    hasNextPage: pagination.hasNextPage ?? page < totalPages,
    hasPrevPage: pagination.hasPrevPage ?? page > 1,
    pagination,
    message: response?.message || 'Blogs fetched successfully',
  }
}

export function buildBlogListRequestBody(params = {}) {
  return {
    page: params.page ?? 1,
    limit: params.limit ?? 100,
    search: params.search?.trim?.() || params.search || '',
    status:
      params.status && params.status !== 'all'
        ? mapUiStatusToApi(params.status)
        : 'ALL',
    date: params.date || '',
  }
}

export function buildBlogSaveFormData(form, { backgroundFile, isEdit = false } = {}) {
  const formData = new FormData()
  const status = form.status === 'published' ? 'ACTIVE' : 'INACTIVE'
  const tableContent = (form.sections || []).map((section, index) => ({
    title: section.topic || `Section ${index + 1}`,
    content: section.content || '',
    order: index + 1,
  }))

  formData.append('title', form.title.trim())
  formData.append('languageId', form.languageId || '')
  formData.append('category', form.category || '')
  formData.append('readTime', form.readTime || '')
  formData.append('status', status)
  formData.append('slug', form.slug?.trim() || '')
  formData.append('metaTitle', (form.metaTitle || form.title || '').trim())
  formData.append('metaDescription', (form.metaDescription || '').trim())
  formData.append('focusKeywords', JSON.stringify(form.focusKeywords || []))
  formData.append('tags', JSON.stringify(form.tags || []))
  formData.append('youtubeVideoUrl', (form.youtubeVideoUrl || '').trim())
  formData.append('isMainBlog', form.isMainBlog ? 'true' : 'false')
  formData.append('tableContent', JSON.stringify(tableContent))

  if (form.publishedAt) {
    formData.append('publishedAt', form.publishedAt)
  }

  if (isEdit && (form.mongoId || form.blogId || form.id)) {
    formData.append('blogId', String(form.blogId || form.mongoId || form.id))
  }

  if (backgroundFile instanceof File) {
    formData.append('thumbnail', backgroundFile)
  }

  return formData
}

export function mapSavedBlogToRow(responseData, form, languageLookup = {}) {
  const mapped = mapApiBlogToRow(responseData, 0, languageLookup)
  if (!mapped) {
    return {
      ...form,
      language: resolveBlogLanguageName(form, languageLookup),
      status: normalizeUiStatus(form.status),
      lastSavedAt: new Date().toISOString(),
    }
  }

  return {
    ...mapped,
    sections: form.sections?.length ? form.sections : mapped.sections,
    backgroundImageName: form.backgroundImageName || mapped.backgroundImageName,
    slugManuallyEdited: Boolean(form.slugManuallyEdited),
  }
}

export function blogStatusLabelFromRow(row) {
  return isBlogActive(row?.status) ? 'Active' : 'Deactivated'
}
