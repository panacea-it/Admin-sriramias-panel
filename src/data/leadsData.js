export const LEAD_CENTERS = ['New Delhi', 'Hyderabad', 'Pune']

export const LEAD_COUNSELORS = ['Rahul', 'Priya', 'Mahesh', 'Anita', 'Vikram']

export const LEAD_STATUS_OPTIONS = [
  'NEW',
  'ASSIGNED',
  'CONTACT_ATTEMPTED',
  'CONTACTED',
  'FOLLOW_UP',
  'INTERESTED',
  'NOT_INTERESTED',
  'INFO_SHARED',
  'MEETING_SCHEDULED',
  'MEETING_COMPLETED',
  'NEGOTIATION',
  'VERIFICATION_IN_PROGRESS',
  'APPROVED',
  'CONVERTED',
  'ON_HOLD',
  'LOST',
  'DUPLICATE',
  'CLOSED',
]

export function formatLeadStatusLabel(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function parseLeadDisplayDate(dateStr) {
  if (!dateStr) return null
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export function formatLeadFilterDate(date) {
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function parseLeadFilterInput(text) {
  const trimmed = String(text || '').trim()
  if (!trimmed) {
    return { valid: false, error: 'Enter a date in DD/MM/YYYY format' }
  }

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) {
    return { valid: false, error: 'Use DD/MM/YYYY format (e.g. 15/10/2026)' }
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid month' }
  }
  if (day < 1 || day > 31) {
    return { valid: false, error: 'Invalid day' }
  }

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { valid: false, error: 'Invalid date' }
  }

  return { valid: true, date }
}

/** Flattened rows — continuation rows use em-dash placeholders for user fields */
export const INITIAL_LEADS = [
  {
    id: 1,
    userName: 'Darshan Kotla',
    email: 'darshan@gmail.com',
    mobile: '6300662566',
    course: '2 Years GS',
    courseSub: 'Foundation Course',
    time: '10:00 PM',
    date: '13 May 2026',
    type: 'Hot',
    status: 'NEW',
    assignedCounselor: 'Rahul',
    center: 'New Delhi',
    dateBucket: 'Today',
  },
  {
    id: 2,
    userName: '—',
    email: '—',
    mobile: '—',
    course: '2 Years GS',
    courseSub: 'Foundation Course',
    time: '10:00 PM',
    date: '13 May 2026',
    type: 'Hot',
    status: 'ASSIGNED',
    assignedCounselor: 'Priya',
    center: 'New Delhi',
    dateBucket: 'Today',
  },
  {
    id: 3,
    userName: '—',
    email: '—',
    mobile: '—',
    course: '2 Years GS',
    courseSub: 'Foundation Course',
    time: '10:00 PM',
    date: '13 May 2026',
    type: 'Hot',
    status: 'FOLLOW_UP',
    assignedCounselor: 'Mahesh',
    center: 'New Delhi',
    dateBucket: 'Today',
  },
  {
    id: 4,
    userName: '—',
    email: '—',
    mobile: '—',
    course: '2 Years GS',
    courseSub: 'Foundation Course',
    time: '10:00 PM',
    date: '13 May 2026',
    type: 'Hot',
    status: 'CONTACTED',
    assignedCounselor: 'Anita',
    center: 'Hyderabad',
    dateBucket: 'Today',
  },
  {
    id: 5,
    userName: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    mobile: '9876543210',
    course: 'UPSC Prelims',
    courseSub: 'Crash Course',
    time: '2:30 PM',
    date: '12 May 2026',
    type: 'Cold',
    status: 'INTERESTED',
    assignedCounselor: 'Vikram',
    center: 'Pune',
    dateBucket: 'This Week',
  },
  {
    id: 6,
    userName: 'Arjun Mehta',
    email: 'arjun.mehta@gmail.com',
    mobile: '9123456780',
    course: 'Ethics Module',
    courseSub: 'Optional Batch',
    time: '11:00 AM',
    date: '11 May 2026',
    type: 'Hot',
    status: 'MEETING_SCHEDULED',
    assignedCounselor: 'Rahul',
    center: 'Hyderabad',
    dateBucket: 'This Month',
  },
]

export const LEAD_STATS = {
  total: 1200,
  hot: 100,
  cold: 100,
  conversionRate: '29.5%',
}
