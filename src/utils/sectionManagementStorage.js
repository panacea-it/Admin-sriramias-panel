import { SEED_SECTION_CONFIGS } from '../data/testConfigurationSeed'

const LEGACY_STORAGE_KEYS = ['tm_section_configs_v1', 'tm_section_configs_v2']
export const SECTION_STORAGE_KEY = 'tm_section_masters_v1'

export function isLegacySectionRow(row) {
  if (!row || typeof row !== 'object') return false
  return (
    row.configurationName != null ||
    row.testType != null ||
    row.totalQuestions != null ||
    row.numberOfSections != null
  )
}

export function isLegacySectionStore(list) {
  return Array.isArray(list) && list.some(isLegacySectionRow)
}

export function normalizeSectionRow(row) {
  if (!row) return null
  const createdOn = row.createdOn || row.createdAt || ''
  const modifiedOn = row.modifiedOn || row.modifiedAt || createdOn
  return {
    id: row.id,
    sectionName: String(row.sectionName || row.configurationName || '').trim(),
    status: row.status === 'Deactivated' ? 'Deactivated' : 'Active',
    createdOn,
    modifiedOn,
  }
}

export function normalizeSectionList(list) {
  return (list || []).map(normalizeSectionRow).filter((row) => row?.id && row.sectionName)
}

export function purgeLegacySectionStorage() {
  if (typeof window === 'undefined') return
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (isLegacySectionStore(parsed)) {
        window.localStorage.removeItem(key)
      }
    } catch {
      window.localStorage.removeItem(key)
    }
  }
}

export function getSectionSeedRows() {
  return normalizeSectionList(SEED_SECTION_CONFIGS)
}
