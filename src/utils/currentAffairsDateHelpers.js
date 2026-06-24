import { MONTH_OPTIONS } from '../data/currentAffairsData'

const MONTH_INDEX = Object.fromEntries(MONTH_OPTIONS.map((name, index) => [name, index]))

export function getDaysInMonth(monthName, year) {
  const monthIndex = MONTH_INDEX[monthName]
  if (monthIndex === undefined) return 31

  const yearNum = parseInt(String(year), 10)
  const safeYear = Number.isFinite(yearNum) ? yearNum : new Date().getFullYear()

  return new Date(safeYear, monthIndex + 1, 0).getDate()
}

export function getDaySelectOptions(monthName, year) {
  const count = getDaysInMonth(monthName, year)
  return Array.from({ length: count }, (_, index) => String(index + 1))
}

export function extractDayFromDateValue(dateValue) {
  if (dateValue == null || dateValue === '') return ''

  const str = String(dateValue).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const day = parseInt(str.slice(8, 10), 10)
    return Number.isFinite(day) ? String(day) : ''
  }

  if (/^\d{1,2}$/.test(str)) {
    return String(parseInt(str, 10))
  }

  const parsed = new Date(str)
  if (!Number.isNaN(parsed.getTime())) {
    return String(parsed.getDate())
  }

  return ''
}

export function composeCurrentAffairsDate(year, month, day) {
  const dayNum = parseInt(String(day), 10)
  const yearNum = parseInt(String(year), 10)
  const monthIndex = MONTH_INDEX[month]

  if (!Number.isFinite(dayNum) || !Number.isFinite(yearNum) || monthIndex === undefined) {
    return ''
  }

  const maxDay = getDaysInMonth(month, yearNum)
  if (dayNum < 1 || dayNum > maxDay) return ''

  const monthPart = String(monthIndex + 1).padStart(2, '0')
  const dayPart = String(dayNum).padStart(2, '0')
  return `${yearNum}-${monthPart}-${dayPart}`
}

export function clampDayForMonth(day, month, year) {
  const dayNum = parseInt(String(day), 10)
  if (!Number.isFinite(dayNum) || !month) return ''

  const maxDay = getDaysInMonth(month, year)
  if (dayNum < 1 || dayNum > maxDay) return ''

  return String(dayNum)
}
