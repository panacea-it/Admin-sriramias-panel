import { getMonthRange, getWeekRange, isSameCalendarDay, startOfDay } from '../utils/dailyCollectionUtils'

export const ENQUIRY_CENTERS = ['New Delhi', 'Hyderabad', 'Pune']
export const ENQUIRY_COUNSELORS = [
  'Rahul Sharma',
  'Priya Singh',
  'Mahesh Kumar',
  'Sneha Reddy',
]

export const ENQUIRY_LEAD_STATUS_OPTIONS = [
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

export function formatEnquiryLeadStatusLabel(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatEnquiryFilterDate(date) {
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function parseEnquiryFilterInput(text) {
  const trimmed = String(text || '').trim()
  if (!trimmed) {
    return { valid: false, error: 'Enter a date in DD/MM/YYYY format' }
  }

  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
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

export function enquiryMatchesSelectedDate(enquiryDateLabel, selectedDate) {
  if (!selectedDate) return true

  const selected = startOfDay(selectedDate)
  const now = startOfDay(new Date())
  const label = String(enquiryDateLabel || '').trim()

  if (label === 'Today') {
    return isSameCalendarDay(selected, now)
  }
  if (label === 'This Week') {
    const { start, end } = getWeekRange(now)
    return selected.getTime() >= start.getTime() && selected.getTime() <= end.getTime()
  }
  if (label === 'This Month') {
    const { start, end } = getMonthRange(now)
    return selected.getTime() >= start.getTime() && selected.getTime() <= end.getTime()
  }

  const parsed = parseEnquiryFilterInput(label)
  if (parsed.valid) {
    return isSameCalendarDay(startOfDay(parsed.date), selected)
  }

  return false
}

export const INITIAL_ENQUIRIES = [
  {
    id: 1,
    student: 'Darshan Kotla',
    email: 'darshan@gmail.com',
    phone: '6300662566',
    enquiryType: 'Admission Enquiry',
    center: 'New Delhi',
    enquiryDate: 'Today',
    status: 'Opened',
    assignedCounselor: 'Rahul Sharma',
    leadStatus: 'CONTACTED',
  },
  {
    id: 2,
    student: 'Darshan Kotla',
    email: 'darshan@gmail.com',
    phone: '6300662566',
    enquiryType: 'Demo',
    center: 'Hyderabad',
    enquiryDate: 'Today',
    status: 'Unopened',
    assignedCounselor: 'Priya Singh',
    leadStatus: 'NEW',
  },
  {
    id: 3,
    student: 'Darshan Kotla',
    email: 'darshan@gmail.com',
    phone: '6300662566',
    enquiryType: 'Admission Enquiry',
    center: 'Pune',
    enquiryDate: 'Today',
    status: 'Opened',
    assignedCounselor: 'Mahesh Kumar',
    leadStatus: 'FOLLOW_UP',
  },
  {
    id: 4,
    student: 'Darshan Kotla',
    email: 'darshan@gmail.com',
    phone: '6300662566',
    enquiryType: 'Demo',
    center: 'New Delhi',
    enquiryDate: 'Today',
    status: 'Unopened',
    assignedCounselor: 'Sneha Reddy',
    leadStatus: 'ASSIGNED',
  },
  {
    id: 5,
    student: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    phone: '9876543210',
    enquiryType: 'Admission Enquiry',
    center: 'Hyderabad',
    enquiryDate: 'This Week',
    status: 'Opened',
    assignedCounselor: 'Rahul Sharma',
    leadStatus: 'INTERESTED',
  },
]

export const ENQUIRY_STATS = {
  total: 1200,
  newThisWeek: 100,
  conversionRate: '29.5%',
  actionPending: 100,
}
