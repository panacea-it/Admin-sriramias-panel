/** Wireframe unit-price matrix — Finance Operation / Dashboard View 1 */

export const FINANCE_UNIT_PRICE_CENTERS = [
  { key: 'delhi', label: 'Delhi' },
  { key: 'hyderabad', label: 'Hyderabad' },
  { key: 'pune', label: 'Pune' },
]

const c = (delhi, hyderabad, pune) => ({ delhi, hyderabad, pune })

function center(available, revenueAmount) {
  if (!available) return null
  return { available: true, revenueAmount }
}

/** @typedef {{ programName: string, courseName: string, deliveryMode: string, centers: Record<string, { available: boolean, revenueAmount: number } | null> }} ProgramUnitPriceRow */

/** @type {ProgramUnitPriceRow[]} */
export const FINANCE_PROGRAM_UNIT_PRICE_ROWS = [
  // GS Foundation
  {
    programName: 'GS Foundation',
    courseName: '1 Year UPSC Course',
    deliveryMode: 'Offline',
    centers: c(center(true, 160000), center(true, 120000), null),
  },
  {
    programName: 'GS Foundation',
    courseName: '1 Year UPSC Course',
    deliveryMode: 'Online',
    centers: c(center(true, 125000), center(true, 80000), null),
  },
  {
    programName: 'GS Foundation',
    courseName: '2 Year UPSC Course',
    deliveryMode: 'Offline',
    centers: c(center(true, 210000), center(true, 150000), null),
  },
  {
    programName: 'GS Foundation',
    courseName: '2 Year UPSC Course',
    deliveryMode: 'Online',
    centers: c(center(true, 175000), center(true, 120000), null),
  },
  {
    programName: 'GS Foundation',
    courseName: '2 Year CSWP Course',
    deliveryMode: 'Offline',
    centers: c(center(true, 210000), null, null),
  },
  {
    programName: 'GS Foundation',
    courseName: '2 Year CSWP Course',
    deliveryMode: 'Online',
    centers: c(center(true, 175000), null, null),
  },
  {
    programName: 'GS Foundation',
    courseName: '3 Year UPSC Course',
    deliveryMode: 'Offline',
    centers: c(null, null, center(true, 139000)),
  },
  {
    programName: 'GS Foundation',
    courseName: '3 Year UPSC Course',
    deliveryMode: 'Online',
    centers: c(null, null, center(true, 111200)),
  },
  {
    programName: 'GS Foundation',
    courseName: '1.5 Years UPSC/MPSC Course',
    deliveryMode: 'Offline',
    centers: c(null, null, center(true, 83050)),
  },
  {
    programName: 'GS Foundation',
    courseName: '1.5 Years UPSC/MPSC Course',
    deliveryMode: 'Online',
    centers: c(null, null, center(true, 66440)),
  },
  {
    programName: 'GS Foundation',
    courseName: '1 Years UPSC/MPSC Course',
    deliveryMode: 'Offline',
    centers: c(null, null, center(true, 69492)),
  },
  {
    programName: 'GS Foundation',
    courseName: '1 Years UPSC/MPSC Course',
    deliveryMode: 'Online',
    centers: c(null, null, center(true, 55593)),
  },
  {
    programName: 'GS Foundation',
    courseName: 'NCERT Foundation Course',
    deliveryMode: 'Offline',
    centers: c(center(true, 19999), null, center(true, 10000)),
  },
  {
    programName: 'GS Foundation',
    courseName: 'NCERT Foundation Course',
    deliveryMode: 'Online',
    centers: c(center(true, 10999), null, center(true, 10000)),
  },

  // Optional Course
  {
    programName: 'Optional Course',
    courseName: 'History',
    deliveryMode: 'Offline',
    centers: c(null, center(true, 45000), null),
  },
  {
    programName: 'Optional Course',
    courseName: 'History',
    deliveryMode: 'Online',
    centers: c(null, center(true, 40000), null),
  },
  {
    programName: 'Optional Course',
    courseName: 'PSIR',
    deliveryMode: 'Offline',
    centers: c(center(true, 45000), null, center(true, 45000)),
  },
  {
    programName: 'Optional Course',
    courseName: 'PSIR',
    deliveryMode: 'Online',
    centers: c(center(true, 40000), null, center(true, 40000)),
  },
  {
    programName: 'Optional Course',
    courseName: 'Geography',
    deliveryMode: 'Offline',
    centers: c(center(true, 45000), null, center(true, 45000)),
  },
  {
    programName: 'Optional Course',
    courseName: 'Geography',
    deliveryMode: 'Online',
    centers: c(center(true, 40000), null, center(true, 40000)),
  },
  {
    programName: 'Optional Course',
    courseName: 'Anthropology',
    deliveryMode: 'Offline',
    centers: c(center(true, 45000), null, null),
  },
  {
    programName: 'Optional Course',
    courseName: 'Anthropology',
    deliveryMode: 'Online',
    centers: c(center(true, 40000), null, null),
  },
  {
    programName: 'Optional Course',
    courseName: 'Sociology',
    deliveryMode: 'Offline',
    centers: c(center(true, 45000), null, null),
  },
  {
    programName: 'Optional Course',
    courseName: 'Sociology',
    deliveryMode: 'Online',
    centers: c(center(true, 40000), null, null),
  },

  // Mentorship
  {
    programName: 'Mentorship',
    courseName: 'Mentorship',
    deliveryMode: 'Offline',
    centers: c(center(true, 59999), center(true, 40000), center(true, 24999)),
  },
  {
    programName: 'Mentorship',
    courseName: 'Mentorship',
    deliveryMode: 'Online',
    centers: c(center(true, 39999), center(true, 30000), center(true, 24999)),
  },

  // Enrichment Course
  {
    programName: 'Enrichment Course',
    courseName: 'IGP',
    deliveryMode: '—',
    centers: c(center(true, 1), null, null),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims Booster',
    deliveryMode: 'Offline',
    centers: c(center(true, 7999), null, null),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims Booster',
    deliveryMode: 'Online',
    centers: c(center(true, 3999), null, null),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims CC',
    deliveryMode: 'Offline',
    centers: c(center(true, 9999), null, center(true, 9999)),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims CC',
    deliveryMode: 'Online',
    centers: c(center(true, 4999), null, center(true, 6999)),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims CC Mentor',
    deliveryMode: 'Offline',
    centers: c(center(true, 12999), null, null),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims CC Mentor',
    deliveryMode: 'Online',
    centers: c(center(true, 7999), null, null),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims CC CSAT',
    deliveryMode: 'Offline',
    centers: c(center(true, 18999), null, null),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims CC CSAT',
    deliveryMode: 'Online',
    centers: c(center(true, 11999), null, null),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims CC CSAT Mentor',
    deliveryMode: 'Offline',
    centers: c(center(true, 20999), null, null),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims CC CSAT Mentor',
    deliveryMode: 'Online',
    centers: c(center(true, 13999), null, null),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims Bundle Course',
    deliveryMode: 'Offline',
    centers: c(center(true, 23999), null, null),
  },
  {
    programName: 'Enrichment Course',
    courseName: 'Prelims Bundle Course',
    deliveryMode: 'Online',
    centers: c(center(true, 14999), null, null),
  },

  // Test Series
  {
    programName: 'Test Series',
    courseName: 'Mains Mirror',
    deliveryMode: 'Offline',
    centers: c(center(true, 39000), null, null),
  },
  {
    programName: 'Test Series',
    courseName: 'Essay',
    deliveryMode: 'Offline',
    centers: c(center(true, 7999), null, null),
  },
  {
    programName: 'Test Series',
    courseName: 'Mains',
    deliveryMode: 'Offline',
    centers: c(center(true, 19999), center(true, 29999), null),
  },
  {
    programName: 'Test Series',
    courseName: 'Mains',
    deliveryMode: 'Online',
    centers: c(center(true, 17999), center(true, 26999), null),
  },
  {
    programName: 'Test Series',
    courseName: 'Prelims and Mentor',
    deliveryMode: 'Offline',
    centers: c(center(true, 12999), null, null),
  },
  {
    programName: 'Test Series',
    courseName: 'Prelims and Mentor',
    deliveryMode: 'Online',
    centers: c(center(true, 10999), null, null),
  },

  // CSAT
  {
    programName: 'CSAT',
    courseName: 'CSAT',
    deliveryMode: 'Offline',
    centers: c(center(true, 17999), null, null),
  },
  {
    programName: 'CSAT',
    courseName: 'CSAT',
    deliveryMode: 'Online',
    centers: c(center(true, 12999), null, null),
  },

  // Books
  {
    programName: 'Books',
    courseName: 'Complete Set',
    deliveryMode: 'Dispatch',
    centers: c(center(true, null), null, null),
  },
  {
    programName: 'Books',
    courseName: 'Indian Economy',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 499), null, null),
  },
  {
    programName: 'Books',
    courseName: 'Indian Polity',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 499), null, null),
  },
  {
    programName: 'Books',
    courseName: 'Science & Technology for UPSC CSE PRELIMS',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 169), null, null),
  },
  {
    programName: 'Books',
    courseName: 'Modern History for UPSC CSE PRELIMS',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 169), null, null),
  },
  {
    programName: 'Books',
    courseName: 'History of Medieval India for UPSC CSE PRELIMS',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 169), null, null),
  },
  {
    programName: 'Books',
    courseName: 'Art & Culture for UPSC CSE PRELIMS',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 169), null, null),
  },
  {
    programName: 'Books',
    courseName: 'Ancient History of India for UPSC CSE PRELIMS',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 169), null, null),
  },
  {
    programName: 'Books',
    courseName: 'Geography for UPSC CSE PRELIMS',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 169), null, null),
  },
  {
    programName: 'Books',
    courseName: 'Indian Polity for UPSC CSE PRELIMS',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 169), null, null),
  },
  {
    programName: 'Books',
    courseName: 'Indian Economy for UPSC CSE PRELIMS',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 169), null, null),
  },
  {
    programName: 'Books',
    courseName: 'Environment & Ecology for UPSC CSE PRELIMS',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 169), null, null),
  },
  {
    programName: 'Books',
    courseName: 'Bundle Prelims Revision Booklet for UPSC CSE PRELIMS',
    deliveryMode: 'Dispatch',
    centers: c(center(true, 1099), null, null),
  },
]

export const FINANCE_PROGRAM_NAMES = [
  'GS Foundation',
  'Optional Course',
  'Mentorship',
  'Enrichment Course',
  'Test Series',
  'CSAT',
  'Books',
]
