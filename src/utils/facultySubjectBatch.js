/** Faculty Subjects (Academics) ↔ Batch Subject Details linking */

export function formatFacultySubjectCode(id) {
  const raw = String(id ?? '').replace(/\D/g, '')
  const num = raw ? parseInt(raw, 10) : 0
  const padded = String(num || id || 0).padStart(3, '0')
  return `SUB-${padded}`
}

export function facultyIdFromTeacher(teacher = '') {
  const name = String(teacher).trim()
  if (!name) return ''
  return `fac-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
}

/** Map academics subject row → batch dropdown / storage shape */
export function mapFacultySubjectToBatchOption(subject) {
  if (!subject?.id) return null
  const subjectId = String(subject.id)
  const subjectName = subject.subjectName || subject.subject || ''
  const facultyName = String(subject.teacher || '').trim()
  const status = subject.status || 'Active'
  return {
    subjectId,
    subjectCode: formatFacultySubjectCode(subjectId),
    subjectName,
    facultyName,
    facultyId: subject.facultyId || facultyIdFromTeacher(facultyName),
    batchCompatibility: status !== 'In Active',
    status,
  }
}

export function formatBatchSubjectDropdownLabel(option) {
  if (!option) return ''
  const code = option.subjectCode || formatFacultySubjectCode(option.subjectId)
  const name = option.subjectName || '—'
  const faculty = option.facultyName || '—'
  return `[${code}] ${name} — ${faculty}`
}

export function linkedSubjectFromFacultyRow(subject) {
  const opt = mapFacultySubjectToBatchOption(subject)
  if (!opt) return null
  return {
    subjectId: opt.subjectId,
    subjectName: opt.subjectName,
    facultyId: opt.facultyId,
    facultyName: opt.facultyName,
  }
}

export function dedupeFacultySubjectOptions(options = []) {
  const seen = new Set()
  return options.filter((opt) => {
    const key = String(opt.subjectId)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function buildFacultySubjectOptionsForBatch(subjects = []) {
  return dedupeFacultySubjectOptions(
    subjects
      .filter((s) => s?.id && s.status !== 'In Active')
      .map(mapFacultySubjectToBatchOption)
      .filter(Boolean),
  )
}

export function enrichLinkedSubjectsWithFaculty(linked = [], subjects = []) {
  const byId = new Map(subjects.map((s) => [String(s.id), s]))
  return linked.map((link) => {
    const row = byId.get(String(link.subjectId))
    if (!row) {
      return {
        ...link,
        facultyName: link.facultyName || '',
        facultyId: link.facultyId || '',
      }
    }
    const opt = mapFacultySubjectToBatchOption(row)
    return {
      subjectId: opt.subjectId,
      subjectName: link.subjectName || opt.subjectName,
      facultyId: link.facultyId || opt.facultyId,
      facultyName: link.facultyName || opt.facultyName,
    }
  })
}

export function findFacultySubjectOption(subjectId, subjects = []) {
  const row = subjects.find((s) => String(s.id) === String(subjectId))
  return row ? mapFacultySubjectToBatchOption(row) : null
}
