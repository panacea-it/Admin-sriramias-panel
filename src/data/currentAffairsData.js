import { CURRENT_AFFAIRS_FORM_CATEGORIES } from '../constants/currentAffairsForm'

export const CURRENT_AFFAIRS_CATEGORIES = CURRENT_AFFAIRS_FORM_CATEGORIES.map((name, i) => ({
  id: i + 1,
  name,
  status: 'Active',
}))

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
