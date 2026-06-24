export const MAX_TOP10_RANKERS = 10

export const RANK_PROGRAM_OPTIONS = [
  { value: 'UPSC CSE', label: 'UPSC CSE' },
  { value: 'IAS Foundation', label: 'IAS Foundation' },
  { value: 'UPSC Optional', label: 'UPSC Optional' },
  { value: 'State PSC', label: 'State PSC' },
  { value: 'IAS Interview', label: 'IAS Interview' },
  { value: 'CSAT Batch', label: 'CSAT Batch' },
]

export const RANK_COURSE_OPTIONS = [
  { value: 'General Studies', label: 'General Studies' },
  { value: 'Economy', label: 'Economy' },
  { value: 'Polity', label: 'Polity' },
  { value: 'History', label: 'History' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Environment', label: 'Environment' },
  { value: 'Ethics', label: 'Ethics' },
  { value: 'International Relations', label: 'International Relations' },
  { value: 'Science & Tech', label: 'Science & Tech' },
]

export const RANK_COURSES_BY_PROGRAM = {
  'UPSC CSE': [
    { value: 'General Studies', label: 'General Studies' },
    { value: 'Economy', label: 'Economy' },
    { value: 'Polity', label: 'Polity' },
    { value: 'History', label: 'History' },
    { value: 'Geography', label: 'Geography' },
    { value: 'Environment', label: 'Environment' },
    { value: 'Science & Tech', label: 'Science & Tech' },
  ],
  'IAS Foundation': [
    { value: 'General Studies', label: 'General Studies' },
    { value: 'CSAT', label: 'CSAT' },
    { value: 'Economy', label: 'Economy' },
    { value: 'Polity', label: 'Polity' },
  ],
  'UPSC Optional': [
    { value: 'Geography', label: 'Geography' },
    { value: 'History', label: 'History' },
    { value: 'Ethics', label: 'Ethics' },
    { value: 'International Relations', label: 'International Relations' },
  ],
  'State PSC': [
    { value: 'General Studies', label: 'General Studies' },
    { value: 'Polity', label: 'Polity' },
    { value: 'History', label: 'History' },
    { value: 'Geography', label: 'Geography' },
  ],
  'IAS Interview': [
    { value: 'Ethics', label: 'Ethics' },
    { value: 'International Relations', label: 'International Relations' },
    { value: 'General Studies', label: 'General Studies' },
  ],
  'CSAT Batch': [
    { value: 'Science & Tech', label: 'Science & Tech' },
    { value: 'Economy', label: 'Economy' },
    { value: 'Polity', label: 'Polity' },
    { value: 'Environment', label: 'Environment' },
  ],
}

export function getCoursesForProgram(program) {
  return RANK_COURSES_BY_PROGRAM[program] ?? RANK_COURSE_OPTIONS
}

const SEED_NAMES = [
  'Darshan Kotla',
  'Priya Sharma',
  'Arjun Mehta',
  'Ananya Reddy',
  'Rohan Gupta',
  'Kavya Nair',
  'Vikram Singh',
  'Meera Joshi',
  'Aditya Verma',
  'Sneha Iyer',
  'Karthik Rao',
  'Divya Menon',
  'Nikhil Desai',
  'Pooja Bansal',
  'Rahul Choudhury',
  'Isha Malhotra',
  'Sanjay Pillai',
  'Neha Agarwal',
]

const SEED_PROGRAMS = [
  'UPSC CSE',
  'IAS Foundation',
  'UPSC Optional',
  'State PSC',
  'IAS Interview',
  'CSAT Batch',
]

const SEED_COURSES = [
  'General Studies',
  'Economy',
  'Polity',
  'History',
  'Geography',
  'Environment',
  'Ethics',
  'International Relations',
  'Science & Tech',
]

const SEED_RANKS = [
  'AIR 1',
  'AIR 2',
  'AIR 4',
  'AIR 7',
  'AIR 12',
  'AIR 18',
  'AIR 25',
  'AIR 31',
  'AIR 42',
  'AIR 56',
  'AIR 68',
  'AIR 75',
  'AIR 89',
  'AIR 95',
  'AIR 102',
  'AIR 118',
  'AIR 134',
  'AIR 150',
]

export function enrichRankerSeedRow(row, index) {
  const createdAt = new Date(Date.now() - index * 86400000).toISOString()
  const created = new Date(createdAt)
  const isActive = row.status !== 'Deactivated'
  const top10SeedOrder = isActive && index >= 1 && index <= 3 ? index : null

  return {
    ...row,
    studentId: `STU-${56565 + index}`,
    name: SEED_NAMES[index % SEED_NAMES.length],
    program: SEED_PROGRAMS[index % SEED_PROGRAMS.length],
    course: SEED_COURSES[index % SEED_COURSES.length],
    rank: SEED_RANKS[index % SEED_RANKS.length],
    isTop10: top10SeedOrder != null,
    displayOrder: top10SeedOrder,
    createdAt,
    time: created.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    date: created.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  }
}

export function enrichRankerSeedRows(rows) {
  return (rows || []).map((row, i) => enrichRankerSeedRow(row, i))
}
