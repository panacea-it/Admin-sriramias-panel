import {
  deleteExamPatternLocal,
  deleteLanguageLocal,
  deleteSectionConfigLocal,
  fetchExamPatternsLocal,
  fetchLanguagesLocal,
  fetchSectionConfigsLocal,
  upsertExamPatternLocal,
  upsertLanguageLocal,
  upsertSectionConfigLocal,
} from '../api/testConfigurationAPI'
import {
  buildCreateExamPatternPayload,
  mapApiExamPatternStatusToUi,
  mapApiExamPatternToLocal,
  mapExamPatternStatusFilterToApi,
} from '../utils/examPatternApiHelpers'
import { normalizeSectionRow } from '../utils/sectionManagementStorage'

function parseSortPreset(sortPreset) {
  switch (sortPreset) {
    case 'createdOn_oldest':
      return { sortBy: 'createdOn', sortDir: 'asc' }
    case 'modifiedOn_newest':
      return { sortBy: 'modifiedOn', sortDir: 'desc' }
    case 'modifiedOn_oldest':
      return { sortBy: 'modifiedOn', sortDir: 'asc' }
    default:
      return { sortBy: 'createdOn', sortDir: 'desc' }
  }
}

function mapLocalStatusFilter(statusFilter) {
  const apiStatus = mapExamPatternStatusFilterToApi(statusFilter)
  if (apiStatus === 'ACTIVE') return 'Active'
  if (apiStatus === 'INACTIVE') return 'Inactive'
  return statusFilter || 'all'
}

function toApiExamPatternRow(row) {
  if (!row) return null
  return {
    _id: row.id,
    instructionId: row.instructionId || row.id,
    instructionDescription: row.instructionDescription,
    status: row.status,
    createdAt: row.createdOn || row.createdAt,
    updatedAt: row.modifiedOn || row.updatedAt,
  }
}

function toLocalExamPatternPayload(payload) {
  const normalized = buildCreateExamPatternPayload(payload)
  return {
    instructionDescription: normalized.instructionDescription,
    status: mapApiExamPatternStatusToUi(normalized.status),
  }
}

export async function getExamPatternsStatic(params = {}) {
  const page = Number(params.page) || 1
  const limit = Number(params.limit) || 10
  const { sortBy, sortDir } = parseSortPreset(params.sortPreset)

  const rows = await fetchExamPatternsLocal({
    search: params.search,
    status: mapLocalStatusFilter(params.status),
    sortBy,
    sortDir,
  })

  const examPatterns = rows.map(toApiExamPatternRow)
  const total = examPatterns.length
  const totalPages = Math.max(1, Math.ceil(total / limit) || 1)
  const start = (page - 1) * limit

  return {
    data: {
      examPatterns: examPatterns.slice(start, start + limit),
      pagination: { total, totalPages, page, limit },
    },
  }
}

export async function getExamPatternByIdStatic(examPatternId) {
  const rows = await fetchExamPatternsLocal({ status: 'all' })
  const row = rows.find((item) => String(item.id) === String(examPatternId))
  return toApiExamPatternRow(row)
}

export async function createExamPatternStatic(data) {
  const saved = await upsertExamPatternLocal(toLocalExamPatternPayload(data))
  return toApiExamPatternRow(saved)
}

export async function updateExamPatternStatic(examPatternId, data) {
  const saved = await upsertExamPatternLocal(toLocalExamPatternPayload(data), {
    id: examPatternId,
    isEdit: true,
  })
  return toApiExamPatternRow(saved)
}

export async function updateExamPatternStatusStatic(examPatternId, status) {
  const rows = await fetchExamPatternsLocal({ status: 'all' })
  const existing = rows.find((item) => String(item.id) === String(examPatternId))
  if (!existing) throw new Error('Instruction not found')

  const saved = await upsertExamPatternLocal(
    {
      instructionDescription: existing.instructionDescription,
      status: mapApiExamPatternStatusToUi(status),
    },
    { id: examPatternId, isEdit: true },
  )
  return toApiExamPatternRow(saved)
}

export async function deleteExamPatternStatic(examPatternId) {
  await deleteExamPatternLocal(examPatternId)
  return { success: true }
}

export async function getExamPatternDropdownStatic() {
  const rows = await fetchExamPatternsLocal({ status: 'Active', sortBy: 'createdOn', sortDir: 'desc' })
  return {
    data: {
      items: rows.map(toApiExamPatternRow).map((row) => mapApiExamPatternToLocal(row)).filter(Boolean),
    },
  }
}

export async function fetchSectionConfigsStatic(params = {}) {
  const rows = await fetchSectionConfigsLocal(params)
  return rows.map((row) => normalizeSectionRow(row))
}

export async function upsertSectionConfigStatic(payload, meta) {
  const saved = await upsertSectionConfigLocal(payload, meta)
  return normalizeSectionRow(saved)
}

export async function deleteSectionConfigStatic(id) {
  await deleteSectionConfigLocal(id)
}

export async function fetchLanguagesStatic(params = {}) {
  return fetchLanguagesLocal(params)
}

export async function upsertLanguageStatic(payload, meta) {
  return upsertLanguageLocal(payload, meta)
}

export async function deleteLanguageStatic(id) {
  await deleteLanguageLocal(id)
}
