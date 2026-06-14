import { isSameCalendarDay, startOfDay } from '../utils/dailyCollectionUtils'

export const NOTIFICATION_CENTERS = ['New Delhi', 'Hyderabad', 'Pune']
export const NOTIFICATION_TYPES = ['Video', 'Text', 'PDF', 'Image']

export const USER_TYPE_OPTIONS = [
  'All Users',
  'Students',
  'Faculty',
  'Center Admins',
]

export const NOTIFICATION_STATUS_OPTIONS = ['SENT', 'UNSENT', 'IN_PROGRESS']

/** @deprecated Use NOTIFICATION_STATUS_OPTIONS */
export const NOTIFICATION_LEAD_STATUS_OPTIONS = NOTIFICATION_STATUS_OPTIONS

export const NOTIFICATION_STATUS_PLACEHOLDER = 'Select Status'

export const NOTIFICATION_STATUS_FILTER_OPTIONS = [
  { value: '', label: NOTIFICATION_STATUS_PLACEHOLDER },
  { value: 'SENT', label: 'Sent' },
  { value: 'UNSENT', label: 'Unsent' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
]

export function formatNotificationStatusLabel(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getNotificationStatusOptions({ includePlaceholder = false } = {}) {
  const options = NOTIFICATION_STATUS_OPTIONS.map((status) => ({
    value: status,
    label: formatNotificationStatusLabel(status),
  }))
  if (includePlaceholder) {
    return [{ value: '', label: NOTIFICATION_STATUS_PLACEHOLDER }, ...options]
  }
  return options
}

export function parsePushNotificationDisplayDate(dateStr) {
  if (!dateStr) return null
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

export function formatPushNotificationFilterDate(date) {
  if (!date) return ''
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function parsePushNotificationFilterInput(text) {
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

export function pushNotificationMatchesSelectedDate(notification, selectedDate) {
  if (!selectedDate) return true
  const notificationDate = parsePushNotificationDisplayDate(notification.sentDate)
  if (!notificationDate) return false
  return isSameCalendarDay(startOfDay(notificationDate), startOfDay(selectedDate))
}

export const INITIAL_PUSH_NOTIFICATIONS = [
  {
    id: 56565,
    sentBy: 'Admin',
    device: 'Android',
    message: 'GEOGRAPHY MAY 14 class is live on 2026-05-14 09:18',
    center: 'New Delhi',
    type: 'Video',
    sentTime: '10 AM',
    sentDate: '26 March 2026',
    dateBucket: 'Today',
    userType: 'All Users',
    title: 'Geography class live',
    url: '',
    leadStatus: 'UNSENT',
    assignedCounselorId: '',
    assignedCounselorName: 'Sneha Gupta',
    centerId: '',
  },
  {
    id: 56566,
    sentBy: 'Admin',
    device: 'iOS',
    message: 'CHEMISTRY revision session starts at 2 PM today.',
    center: 'Hyderabad',
    type: 'Video',
    sentTime: '9 AM',
    sentDate: '26 March 2026',
    dateBucket: 'Today',
    userType: 'Students',
    title: 'Chemistry revision',
    url: '',
    leadStatus: 'IN_PROGRESS',
    assignedCounselorId: '',
    assignedCounselorName: 'Priya Singh',
    centerId: '',
  },
  {
    id: 56567,
    sentBy: 'Priya Sharma',
    device: 'Android',
    message:
      'New study material uploaded for Current Affairs — March 2026. Students can review the PDF from the learning portal before the weekend test.',
    center: 'Pune',
    type: 'Text',
    sentTime: '8 AM',
    sentDate: '25 March 2026',
    dateBucket: 'This Week',
    userType: 'All Users',
    title: 'Current Affairs update',
    url: 'https://example.com/ca-march',
    leadStatus: 'SENT',
    assignedCounselorId: '',
    assignedCounselorName: 'Rahul Sharma',
    centerId: '',
  },
  {
    id: 56568,
    sentBy: 'Admin',
    device: 'Android',
    message:
      'Physics doubt session recording is now available. Students can access it from the Learning Portal. Please watch before tomorrow\'s live session.',
    center: 'New Delhi',
    type: 'Video',
    sentTime: '6 PM',
    sentDate: '24 March 2026',
    dateBucket: 'This Week',
    userType: 'Students',
    title: 'Physics recording',
    url: '',
    leadStatus: 'SENT',
    assignedCounselorId: '',
    assignedCounselorName: 'Ankit Verma',
    centerId: '',
  },
]

export const EMPTY_NOTIFICATION_FORM = {
  userType: 'All Users',
  title: '',
  message: '',
  url: '',
  pdfName: '',
  videoName: '',
  imageName: '',
  centerId: '',
  assignedCounselorId: '',
  leadStatus: '',
  type: 'Text',
  sentDate: '',
  sentTime: '',
}
