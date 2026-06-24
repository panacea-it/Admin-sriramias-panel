const ts = '2026-05-16T10:30:00'
const ts2 = '2026-05-18T14:20:00'

/** Academic programs — top of hierarchy */
export const INITIAL_PROGRAMS = [
  {
    id: 'PRG001',
    programId: 'PRG001',
    name: 'UPSC Complete Program',
    description: 'Full-stack UPSC preparation including Prelims, Mains, and Interview guidance.',
    status: 'Active',
    courseIds: [1, 2, 5],
    centerIds: [],
    createdAt: ts,
    updatedAt: ts2,
  },
  {
    id: 'PRG002',
    programId: 'PRG002',
    name: 'State PSC Programs',
    description: 'Maharashtra, Tamil Nadu, and Andhra Pradesh state service exam batches.',
    status: 'Active',
    courseIds: [2, 4],
    centerIds: [],
    createdAt: ts,
    updatedAt: ts,
  },
  {
    id: 'PRG003',
    programId: 'PRG003',
    name: 'Foundation Programs',
    description: 'NCERT and GS foundation tracks for beginners.',
    status: 'Active',
    courseIds: [2, 4],
    centerIds: [],
    createdAt: ts,
    updatedAt: ts,
  },
  {
    id: 'PRG004',
    programId: 'PRG004',
    name: 'Crash Course Programs',
    description: 'Short-duration intensive revision and test series bundles.',
    status: 'In Active',
    courseIds: [5],
    centerIds: [],
    createdAt: ts,
    updatedAt: ts,
  },
]

/** Seed centre IDs filled at runtime when CentersProvider loads — names resolved in UI */
export function seedProgramCenterIds(programs, activeCenters) {
  if (!activeCenters?.length) return programs
  const pick = (i) => activeCenters[i % activeCenters.length]?.centerId
  return programs.map((p, idx) => ({
    ...p,
    centerIds: p.centerIds?.length ? p.centerIds : [pick(idx), pick(idx + 1)].filter(Boolean),
  }))
}

export function nextProgramId(list) {
  const max = list.reduce((m, row) => {
    const num = parseInt(String(row.programId || row.id).replace(/\D/g, ''), 10) || 0
    return Math.max(m, num)
  }, 0)
  return `PRG${String(max + 1).padStart(3, '0')}`
}

/** Program → Exam Category mapping for hierarchy */
export const PROGRAM_EXAM_CATEGORY_MAP = {
  PRG001: ['UPSC'],
  PRG002: ['MH PSC', 'TNPSC'],
  PRG003: ['UPSC'],
  PRG004: ['UPSC', 'TNPSC'],
}
