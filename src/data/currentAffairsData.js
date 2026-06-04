import { CURRENT_AFFAIRS_FORM_CATEGORIES } from '../constants/currentAffairsForm'

export const CURRENT_AFFAIRS_CATEGORIES = CURRENT_AFFAIRS_FORM_CATEGORIES.map((name, i) => ({
  id: i + 1,
  name,
  status: 'Active',
}))

export const INITIAL_CURRENT_AFFAIRS = [
  {
    id: 1,
    name: 'April 10 - Current Affairs',
    category: 'Current Affairs',
    status: 'Active',
  },
  {
    id: 2,
    name: 'Prelims - Practice Questions',
    category: 'Daily Practice Questions',
    status: 'Active',
  },
  {
    id: 3,
    name: 'April - Monthly Recap',
    category: 'Monthly Recap',
    status: 'Active',
  },
  {
    id: 4,
    name: 'March Infographics Pack',
    category: 'Infographics',
    status: 'Active',
  },
  {
    id: 5,
    name: 'May 2026 Magazine',
    category: 'Monthly Magazine',
    status: 'In Active',
  },
  {
    id: 6,
    name: 'Weekly Current Affairs Digest',
    category: 'Current Affairs',
    status: 'Active',
  },
]

export { getCurrentAffairsYearOptions as getYearOptions } from '../utils/currentAffairsYearOptions'

/** @deprecated Use getCurrentAffairsYearOptions() for dynamic years */
export const YEAR_OPTIONS = []

export const MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
