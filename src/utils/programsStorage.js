import { INITIAL_PROGRAMS, seedProgramCenterIds } from '../data/programsData'

const STORAGE_KEY = 'sriram_programs_v1'

export function loadPrograms(activeCenters = []) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    /* ignore */
  }
  const seeded = seedProgramCenterIds(INITIAL_PROGRAMS, activeCenters)
  savePrograms(seeded)
  return seeded
}

export function savePrograms(programs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(programs))
    window.dispatchEvent(new CustomEvent('programs-updated', { detail: programs }))
  } catch {
    /* ignore */
  }
}

export function formatProgramLabel(program) {
  if (!program) return ''
  const id = program.programId || program.id
  return `${id} - ${program.name}`
}

/** Programs assigned to a centre (centerIds includes centre) */
export function getProgramsForCentre(programs, centerId) {
  if (!centerId) return []
  const key = String(centerId)
  return programs.filter((p) => (p.centerIds || []).map(String).includes(key))
}

export function findProgramById(programs, programId) {
  return programs.find((p) => p.programId === programId || p.id === programId)
}
