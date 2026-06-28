import api from './axiosInstance'
import { isFrontendOnly } from '../config/appMode'
import { getApiErrorMessage } from '../utils/apiError'
import {
  buildBlogListRequestBody,
  buildBlogSaveFormData,
  isBlogApiSuccess,
  mapApiBlogToRow,
  normalizeBlogDropdownList,
  normalizeBlogLanguageList,
  normalizeBlogListResponse,
} from '../utils/blogApiHelpers'

const BLOG_BASE = '/blog'
const USE_MOCK = isFrontendOnly || import.meta.env.VITE_BLOG_USE_MOCK === 'true'

function toBlogError(error, fallback) {
  const err = new Error(getApiErrorMessage(error, fallback))
  err.cause = error
  return err
}

function unwrapDropdownData(response) {
  const body = response?.data ?? {}
  if (!isBlogApiSuccess(body)) {
    throw toBlogError(body, body.message || 'Unable to fetch blog dropdown data.')
  }
  return body.data ?? []
}

export async function fetchBlogLanguagesDropdown() {
  if (USE_MOCK) {
    return normalizeBlogLanguageList([
      { languageId: 'LG-0001', languageName: 'English' },
      { languageId: 'LG-0002', languageName: 'Hindi' },
      { languageId: 'LG-0003', languageName: 'Telugu' },
    ])
  }

  try {
    const response = await api.post(`${BLOG_BASE}/dropdown/languages`, {})
    return normalizeBlogLanguageList(unwrapDropdownData(response))
  } catch (error) {
    throw toBlogError(error, 'Unable to fetch blog languages.')
  }
}

export async function fetchBlogCategoriesDropdown() {
  if (USE_MOCK) {
    return normalizeBlogDropdownList([
      { label: 'GS I', value: 'GS I' },
      { label: 'GS II', value: 'GS II' },
      { label: 'GS III', value: 'GS III' },
      { label: 'GS IV', value: 'GS IV' },
      { label: 'STRATEGY', value: 'STRATEGY' },
    ])
  }

  try {
    const response = await api.post(`${BLOG_BASE}/dropdown/categories`, {})
    return normalizeBlogDropdownList(unwrapDropdownData(response))
  } catch (error) {
    throw toBlogError(error, 'Unable to fetch blog categories.')
  }
}

export async function fetchBlogReadTimeDropdown() {
  if (USE_MOCK) {
    return normalizeBlogDropdownList([
      { label: '5 min read', value: '5 min read' },
      { label: '6 min read', value: '6 min read' },
      { label: '7 min read', value: '7 min read' },
      { label: '8 min read', value: '8 min read' },
      { label: '9 min read', value: '9 min read' },
      { label: '10 min read', value: '10 min read' },
      { label: '12 min read', value: '12 min read' },
      { label: '15 min read', value: '15 min read' },
    ])
  }

  try {
    const response = await api.post(`${BLOG_BASE}/dropdown/read-time`, {})
    return normalizeBlogDropdownList(unwrapDropdownData(response))
  } catch (error) {
    throw toBlogError(error, 'Unable to fetch blog read time options.')
  }
}

export async function fetchBlogDropdowns() {
  const [languages, categories, readTimes] = await Promise.all([
    fetchBlogLanguagesDropdown(),
    fetchBlogCategoriesDropdown(),
    fetchBlogReadTimeDropdown(),
  ])

  return { languages, categories, readTimes }
}

export async function fetchBlogListPage(params = {}, languageLookup = {}) {
  if (USE_MOCK) {
    return {
      items: [],
      total: 0,
      page: 1,
      limit: params.limit ?? 10,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
    }
  }

  try {
    const response = await api.post(`${BLOG_BASE}/list`, buildBlogListRequestBody(params))
    const body = response?.data ?? {}
    if (!isBlogApiSuccess(body)) {
      throw toBlogError(body, body.message || 'Unable to fetch blogs.')
    }
    return normalizeBlogListResponse(body, languageLookup)
  } catch (error) {
    throw toBlogError(error, 'Unable to fetch blogs.')
  }
}

export async function fetchBlogDetails(blogId, languageLookup = {}) {
  const trimmedId = String(blogId || '').trim()
  if (!trimmedId) {
    throw toBlogError(null, 'Blog ID is required.')
  }

  if (USE_MOCK) {
    return null
  }

  try {
    const response = await api.post(`${BLOG_BASE}/details`, { blogId: trimmedId })
    const body = response?.data ?? {}
    if (!isBlogApiSuccess(body) || !body.data) {
      throw toBlogError(body, body.message || 'Unable to fetch blog details.')
    }
    return mapApiBlogToRow(body.data, 0, languageLookup)
  } catch (error) {
    throw toBlogError(error, 'Unable to fetch blog details.')
  }
}

export async function saveBlog(form, options = {}) {
  if (USE_MOCK) {
    return {
      success: true,
      statusCode: 10000,
      message: options.isEdit ? 'Blog updated successfully' : 'Blog saved successfully',
      data: form,
    }
  }

  try {
    const formData = buildBlogSaveFormData(form, options)
    const response = await api.post(`${BLOG_BASE}/save`, formData)
    const body = response?.data ?? {}
    if (!isBlogApiSuccess(body)) {
      throw toBlogError(body, body.message || 'Unable to save blog.')
    }
    return body
  } catch (error) {
    throw toBlogError(error, options.isEdit ? 'Unable to update blog.' : 'Unable to save blog.')
  }
}

export async function updateBlogStatus(blogId, status) {
  const trimmedId = String(blogId || '').trim()
  const trimmedStatus = String(status || '').trim().toUpperCase()

  if (!trimmedId) {
    throw toBlogError(null, 'Blog ID is required.')
  }

  if (!['ACTIVE', 'INACTIVE'].includes(trimmedStatus)) {
    throw toBlogError(null, 'Invalid blog status.')
  }

  if (USE_MOCK) {
    return {
      success: true,
      statusCode: 10000,
      message: 'Blog status updated successfully',
      data: {
        blogId: trimmedId,
        status: trimmedStatus,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  try {
    const response = await api.put(`${BLOG_BASE}/status`, {
      blogId: trimmedId,
      status: trimmedStatus,
    })
    const body = response?.data ?? {}
    if (!isBlogApiSuccess(body)) {
      throw toBlogError(body, body.message || 'Unable to update blog status.')
    }
    return body
  } catch (error) {
    throw toBlogError(error, 'Unable to update blog status.')
  }
}

async function requestBlogMainUpdate(blogId, endpoint) {
  const trimmedId = String(blogId || '').trim()
  if (!trimmedId) {
    throw toBlogError(null, 'Blog ID is required.')
  }

  try {
    const response = await api.put(endpoint, { blogId: trimmedId })
    const body = response?.data ?? {}
    if (!isBlogApiSuccess(body)) {
      throw toBlogError(body, body.message || 'Unable to update main blog.')
    }
    return body
  } catch (error) {
    throw toBlogError(error, 'Unable to update main blog.')
  }
}

export async function setBlogAsMain(blogId) {
  if (USE_MOCK) {
    return {
      success: true,
      statusCode: 10000,
      message: 'Blog set as main successfully',
      data: {
        blogId: String(blogId || '').trim(),
        isMainBlog: true,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  return requestBlogMainUpdate(blogId, `${BLOG_BASE}/set-main`)
}

export async function removeBlogFromMain(blogId) {
  if (USE_MOCK) {
    return {
      success: true,
      statusCode: 10000,
      message: 'Blog removed from main successfully',
      data: {
        blogId: String(blogId || '').trim(),
        isMainBlog: false,
        updatedAt: new Date().toISOString(),
      },
    }
  }

  return requestBlogMainUpdate(blogId, `${BLOG_BASE}/set-main`)
}

export async function deleteBlog(blogId) {
  const trimmedId = String(blogId || '').trim()
  if (!trimmedId) {
    throw toBlogError(null, 'Blog ID is required.')
  }

  if (USE_MOCK) {
    return {
      success: true,
      statusCode: 10000,
      message: 'Blog deleted successfully',
      data: {
        blogId: trimmedId,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
      },
    }
  }

  try {
    const response = await api.delete(`${BLOG_BASE}/delete`, {
      data: { blogId: trimmedId },
    })
    const body = response?.data ?? {}
    if (!isBlogApiSuccess(body)) {
      throw toBlogError(body, body.message || 'Unable to delete blog.')
    }
    return body
  } catch (error) {
    throw toBlogError(error, 'Unable to delete blog.')
  }
}
