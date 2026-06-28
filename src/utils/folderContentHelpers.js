import { generateContentId } from './facultySubjectContentStorage'
import { API_CATEGORY_TO_TYPE } from './facultySubjectFolderHelpers'
import { normalizeLiveClassesListResponse, mapApiLiveClassToFolderItem } from './liveClassHelpers'
import {
  normalizeRecordingsListResponse,
  mapApiRecordingToFolderItem,
} from './recordingHelpers'
import {
  extractCategoryContentItems,
  extractCategoryContentMeta,
} from './facultySubjectCategoryContentHelpers'

const TITLE_FIELD_BY_CATEGORY = {
  LIVE_CLASS: 'classTitle',
  RECORDING: 'lessonName',
  PDF: 'pdfTitle',
  PRELIMS_TEST: 'testName',
  MAINS_ANSWER_WRITING: 'testName',
}

const UI_ITEM_TYPE_BY_CATEGORY = {
  LIVE_CLASS: 'LIVE_CLASS',
  RECORDING: 'RECORDED_CLASS',
  PDF: 'PDFS',
  PRELIMS_TEST: 'TEST_SERIES',
  MAINS_ANSWER_WRITING: 'MAINS_ANSWER_WRITING',
}

function normalizeFolderContentList(data) {
  if (Array.isArray(data?.data)) return data.data
  return extractCategoryContentItems(data)
}

export function normalizeFolderContentResponse(data, apiCategory) {
  const rows = normalizeFolderContentList(data)
  const meta = extractCategoryContentMeta(data?.content ? data : { content: data })

  if (apiCategory === 'RECORDING') {
    return {
      ...meta,
      items: normalizeRecordingsListResponse(data)
        .map((row) => mapApiRecordingToFolderItem(row))
        .filter(Boolean),
    }
  }

  if (apiCategory === 'LIVE_CLASS') {
    return {
      ...meta,
      items: normalizeLiveClassesListResponse(data)
        .map((row) => mapApiLiveClassToFolderItem(row))
        .filter(Boolean),
    }
  }

  const uiType = UI_ITEM_TYPE_BY_CATEGORY[apiCategory] || apiCategory
  const titleField = TITLE_FIELD_BY_CATEGORY[apiCategory] || 'title'

  return {
    ...meta,
    items: rows
      .map((row) => {
        if (!row || typeof row !== 'object') return null
        const id = String(row._id ?? row.id ?? '').trim()
        if (!id) return null
        const title = String(row[titleField] ?? row.title ?? row.name ?? 'Untitled').trim()
        return {
          id: generateContentId('item'),
          apiId: id,
          itemType: uiType,
          title,
          linkedExistingFormId: id,
          status: String(row.publishStatus ?? row.visibility ?? row.status ?? 'draft').toLowerCase(),
          lastUpdated: row.updatedAt || row.createdAt || new Date().toISOString(),
          data: row,
        }
      })
      .filter(Boolean),
  }
}

export function mapUiCategoryToApiCategory(categoryType) {
  const key = String(categoryType || '').trim()
  const reverse = Object.entries(API_CATEGORY_TO_TYPE).find(([, ui]) => ui === key)
  return reverse?.[0] || key
}
