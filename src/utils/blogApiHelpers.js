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

function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || '').trim())
}

export function normalizeBlogLanguageOption(option) {
  if (!option || typeof option !== 'object') return null

  const mongoId = String(option._id ?? option.id ?? '').trim()
  const publicLanguageId = String(option.languageId ?? option.value ?? '').trim()
  const languageName = String(option.languageName ?? option.label ?? '').trim()

  const apiLanguageId = isMongoObjectId(mongoId)
    ? mongoId
    : isMongoObjectId(publicLanguageId)
      ? publicLanguageId
      : mongoId || publicLanguageId

  if (!apiLanguageId || !languageName) return null

  return {
    languageId: apiLanguageId,
    publicLanguageId,
    languageName,
    label: languageName,
    value: apiLanguageId,
  }
}

export function buildBlogLanguageLookup(languages = []) {
  const byId = {}
  const byPublicId = {}
  const byName = {}

  for (const item of languages) {
    const normalized = normalizeBlogLanguageOption(item)
    if (!normalized) continue
    byId[normalized.languageId] = normalized
    if (normalized.publicLanguageId) {
      byPublicId[normalized.publicLanguageId] = normalized
    }
    byName[normalized.languageName.toLowerCase()] = normalized
  }

  return { byId, byPublicId, byName }
}

export function resolveBlogLanguageId(blog, languageLookup = {}) {
  const topLevel = String(blog?.languageId || '').trim()
  if (topLevel && isMongoObjectId(topLevel)) return topLevel

  const nestedMongoId = String(
    blog?.language?._id ?? blog?.language?.id ?? '',
  ).trim()
  if (nestedMongoId && isMongoObjectId(nestedMongoId)) return nestedMongoId

  if (topLevel && languageLookup.byId?.[topLevel]) {
    return languageLookup.byId[topLevel].languageId
  }

  if (topLevel && languageLookup.byPublicId?.[topLevel]) {
    return languageLookup.byPublicId[topLevel].languageId
  }

  const languageName =
    typeof blog?.language === 'object'
      ? blog.language?.languageName
      : blog?.language
  const fromName = languageName
    ? languageLookup.byName?.[String(languageName).trim().toLowerCase()]
    : null

  return fromName?.languageId || ''
}

export function resolveBlogLanguageName(blog, languageLookup = {}) {
  if (typeof blog?.language === 'string' && blog.language.trim()) {
    return blog.language.trim()
  }

  if (blog?.language?.languageName) {
    return blog.language.languageName
  }

  const languageId = String(blog?.languageId || '').trim()
  const match =
    (languageId && languageLookup.byId?.[languageId]) ||
    (languageId && languageLookup.byPublicId?.[languageId]) ||
    null

  return match?.languageName || blog?.languageName || ''
}

function appendResolvedLanguageId(formData, form, languageLookup = {}) {
  const languageId = resolveBlogLanguageId(form, languageLookup)
  if (!languageId || !isMongoObjectId(languageId)) {
    throw new Error('Please select a valid language from the dropdown.')
  }
  formData.append('languageId', languageId)
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
  const languageId = resolveBlogLanguageId(item, languageLookup)
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
    : Array.isArray(item.tableContent)
      ? item.tableContent
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

export function mapApiBlogListItemToRow(item, index = 0, languageLookup = {}) {
  if (!item) return null

  const rawStatus = item.status != null ? String(item.status) : ''
  const timestamp = item.updatedAt || item.createdAt || item.date || item.publishedAt
  const published = formatDateFields(timestamp)
  const languageId = resolveBlogLanguageId(item, languageLookup)
  const languageName =
    item.languageName ||
    item.language?.languageName ||
    (typeof item.language === 'string' ? item.language : '') ||
    resolveBlogLanguageName({ ...item, languageId }, languageLookup)

  return {
    id: item._id || item.id || item.blogId || `blog-${index}`,
    mongoId: String(item._id || item.id || ''),
    blogId: item.blogId || '',
    title: item.title || '',
    category: item.category || '',
    languageId,
    language: languageName,
    readTime: item.readTime || '',
    listDate: item.date || published.date,
    listTime: item.time || published.time,
    listStatus: rawStatus,
    mainBlogLabel: item.isMainBlog ? 'Yes' : 'No',
    isMainBlog: Boolean(item.isMainBlog),
    status: mapApiStatusToUi(item.status ?? item.isActive),
    slug: item.slug || '',
    publishedAt: published.iso || item.publishedAt || item.createdAt || new Date().toISOString(),
    lastSavedAt: item.updatedAt || item.lastSavedAt || published.iso || item.publishedAt || item.createdAt || '',
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

export function applyBlogUpdateToRow(existingRow, apiData, languageLookup = {}) {
  if (!existingRow || !apiData) return existingRow

  const merged = { ...existingRow, ...apiData }
  const listPatch = mapApiBlogListItemToRow(merged, 0, languageLookup)
  const detailPatch = mapApiBlogToRow(merged, 0, languageLookup)

  if (!listPatch) return existingRow

  const published = formatDateFields(apiData.updatedAt || apiData.createdAt || apiData.publishedAt)

  return {
    ...existingRow,
    ...listPatch,
    title: detailPatch?.title || listPatch.title,
    slug: detailPatch?.slug || listPatch.slug,
    language: detailPatch?.language || listPatch.language,
    readTime: detailPatch?.readTime || listPatch.readTime,
    category: detailPatch?.category || listPatch.category,
    listDate: apiData.date || published.date || listPatch.listDate,
    listTime: apiData.time || published.time || listPatch.listTime,
    lastSavedAt: apiData.updatedAt || listPatch.lastSavedAt || existingRow.lastSavedAt,
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
    .map((item, index) => mapApiBlogListItemToRow(item, index, languageLookup))
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

export function buildBlogSaveFormData(form, { backgroundFile, languageLookup = {} } = {}) {
  const formData = new FormData()
  const status = form.status === 'published' ? 'ACTIVE' : 'INACTIVE'
  const tableOfContents = (form.sections || []).map((section, index) => ({
    order: section.order ?? index + 1,
    topic: section.topic || `Section ${index + 1}`,
    content: section.content || '',
  }))

  formData.append('title', form.title.trim())
  appendResolvedLanguageId(formData, form, languageLookup)
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
  formData.append('tableOfContents', JSON.stringify(tableOfContents))

  if (form.publishedAt) {
    formData.append('publishedAt', form.publishedAt)
  }

  if (backgroundFile instanceof File) {
    formData.append('backgroundImage', backgroundFile)
  }

  ;(form.sections || []).forEach((section) => {
    if (section.imageFile instanceof File) {
      formData.append('sectionImages', section.imageFile)
    }
  })

  return formData
}

function resolveSectionImageForUpdate(section) {
  if (section.imageFile instanceof File) {
    return null
  }

  const rawImage = section.image
  if (typeof rawImage === 'string' && rawImage.trim()) {
    const trimmed = rawImage.trim()
    if (trimmed.startsWith('http') || trimmed.startsWith('/')) {
      return trimmed
    }
  }

  return null
}

export function buildBlogUpdateFormData(form, { backgroundFile, languageLookup = {} } = {}) {
  const formData = new FormData()
  const status = form.status === 'published' ? 'ACTIVE' : 'INACTIVE'
  const blogId = String(form.blogId || '').trim()

  if (!blogId) {
    throw new Error('Blog ID is required for update.')
  }

  const tableOfContents = (form.sections || []).map((section, index) => ({
    order: section.order ?? index + 1,
    topic: section.topic || `Section ${index + 1}`,
    image: resolveSectionImageForUpdate(section),
    content: section.content || '',
  }))

  formData.append('blogId', blogId)
  formData.append('title', form.title.trim())
  appendResolvedLanguageId(formData, form, languageLookup)
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
  formData.append('tableOfContents', JSON.stringify(tableOfContents))

  if (form.publishedAt) {
    formData.append('publishedAt', form.publishedAt)
  }

  if (backgroundFile instanceof File) {
    formData.append('backgroundImage', backgroundFile)
  }

  ;(form.sections || []).forEach((section) => {
    if (section.imageFile instanceof File) {
      formData.append('sectionImages', section.imageFile)
    }
  })

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
    sections: mapped.sections?.length ? mapped.sections : form.sections || [],
    backgroundImageName: form.backgroundImageName || mapped.backgroundImageName,
    slugManuallyEdited: Boolean(form.slugManuallyEdited),
  }
}

export function blogStatusLabelFromRow(row) {
  return isBlogActive(row?.status) ? 'Active' : 'Deactivated'
}
