import api from '../config/api'
import {
  SIDEBAR_SECTION_KEYS,
  getSidebarSectionLabel,
  normalizeSectionKey,
} from '../constants/quickLinksConstants'
import { throwApiError } from '../utils/apiError'

function unwrapList(data) {
  return Array.isArray(data?.data) ? data.data : []
}

function unwrapOne(data) {
  return data?.data ?? data
}

function isRouteNotFound(error) {
  const status = error?.response?.status
  const message = String(error?.response?.data?.message || '').toLowerCase()
  return status === 404 || message.includes('route not found')
}

function buildFallbackSection(sectionKey) {
  const key = normalizeSectionKey(sectionKey)
  return {
    sectionKey: key,
    sectionName: getSidebarSectionLabel(key),
    heading: getSidebarSectionLabel(key),
    isActive: true,
    ctaLabel: '',
    ctaHref: '',
    viewAllHref: '',
    quizQuestion: '',
    quizOptions: [],
    items: [],
    updatedAt: null,
  }
}

function buildFallbackSectionList() {
  return SIDEBAR_SECTION_KEYS.map((sectionKey) => buildFallbackSection(sectionKey))
}

export async function fetchHomepageSidebarSections() {
  try {
    const response = await api.get('/api/homepage-sidebar-sections')
    return unwrapList(response.data)
  } catch (error) {
    if (isRouteNotFound(error)) {
      return buildFallbackSectionList()
    }
    throwApiError(error)
  }
}

export async function fetchHomepageSidebarSectionByKey(sectionKey) {
  const key = normalizeSectionKey(sectionKey)
  try {
    const response = await api.get(`/api/homepage-sidebar-sections/${encodeURIComponent(key)}`)
    return unwrapOne(response.data)
  } catch (error) {
    if (isRouteNotFound(error)) {
      return buildFallbackSection(key)
    }
    throwApiError(error)
  }
}

export async function updateHomepageSidebarSection(sectionKey, payload) {
  const key = normalizeSectionKey(sectionKey)
  const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData
  try {
    const response = await api.put(
      `/api/homepage-sidebar-sections/${encodeURIComponent(key)}`,
      payload,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined,
    )
    return unwrapOne(response.data)
  } catch (error) {
    throwApiError(error)
  }
}
