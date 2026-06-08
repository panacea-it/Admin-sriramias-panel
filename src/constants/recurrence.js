export const REPEAT_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom (every N days)' },
]

export const MONTHLY_MODES = [
  { value: 'same_date', label: 'Same date every month' },
  { value: 'first_weekday', label: 'First weekday of month' },
  { value: 'last_weekday', label: 'Last weekday of month' },
]

export const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
]

export const RECURRENCE_EDIT_SCOPES = [
  { value: 'this', label: 'Edit only this occurrence', description: 'Changes apply to this session only.' },
  {
    value: 'future',
    label: 'Edit this and future occurrences',
    description: 'Updates this session and all sessions after it in the series.',
  },
  {
    value: 'series',
    label: 'Edit entire recurring series',
    description: 'Rebuilds the full schedule from your recurrence settings.',
  },
]

export const RECURRENCE_DELETE_SCOPES = [
  { value: 'this', label: 'Delete single occurrence', description: 'Removes only this session.' },
  {
    value: 'future',
    label: 'Delete future occurrences',
    description: 'Removes this session and all later sessions in the series.',
  },
  {
    value: 'series',
    label: 'Delete complete recurring schedule',
    description: 'Removes every session in this recurring series.',
  },
]

export const MAX_RECURRENCE_OCCURRENCES = 366
