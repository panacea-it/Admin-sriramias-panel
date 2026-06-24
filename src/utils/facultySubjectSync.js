import {
  loadAcademicsSubjects,
  saveAcademicsSubjects,
} from './academicsSubjectsStorage'
import { mapApiFacultySubjectToRow } from './facultySubjectHelpers'

function mergeRowWithLocal(apiRow, existing) {
  return {
    ...(existing || {}),
    ...apiRow,
    liveClasses: existing?.liveClasses || apiRow.liveClasses || [],
    recordings: existing?.recordings || apiRow.recordings || [],
    pdfs: existing?.pdfs || [],
    testSeries: existing?.testSeries ?? apiRow.testSeries ?? null,
  }
}

export function syncFacultySubjectsToLocalStorage(apiRows) {
  if (!Array.isArray(apiRows) || !apiRows.length) return
  const existing = loadAcademicsSubjects()
  const byId = new Map(existing.map((s) => [String(s.id), s]))
  const incomingIds = new Set(apiRows.map((r) => String(r.id)))

  const mergedIncoming = apiRows.map((row) =>
    mergeRowWithLocal(row, byId.get(String(row.id))),
  )

  const preserved = existing.filter((s) => !incomingIds.has(String(s.id)))
  saveAcademicsSubjects([...mergedIncoming, ...preserved])
  window.dispatchEvent(new CustomEvent('academics-subjects-updated'))
}

export function syncSingleFacultySubjectToLocal(data) {
  const row = mapApiFacultySubjectToRow(data)
  if (!row) return
  const existing = loadAcademicsSubjects()
  const idx = existing.findIndex((s) => String(s.id) === String(row.id))
  const merged = mergeRowWithLocal(row, idx >= 0 ? existing[idx] : null)
  const next =
    idx >= 0
      ? existing.map((s, i) => (i === idx ? merged : s))
      : [...existing, merged]
  saveAcademicsSubjects(next)
  window.dispatchEvent(new CustomEvent('academics-subjects-updated'))
}

export function removeFacultySubjectFromLocalStorage(facultySubjectId) {
  const existing = loadAcademicsSubjects()
  const next = existing.filter((s) => String(s.id) !== String(facultySubjectId))
  if (next.length !== existing.length) {
    saveAcademicsSubjects(next)
    window.dispatchEvent(new CustomEvent('academics-subjects-updated'))
  }
}
