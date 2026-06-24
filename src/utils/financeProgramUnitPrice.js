import {
  FINANCE_PROGRAM_UNIT_PRICE_ROWS,
  FINANCE_UNIT_PRICE_CENTERS,
} from '../data/financeProgramUnitPriceData'
import { getPeriodRange, startOfDay } from './dailyCollectionUtils'

function isPaidPayment(payment) {
  const status = String(payment?.paymentStatus || '').toLowerCase()
  return status === 'paid' || (payment?.amountPaid > 0 && status !== 'failed')
}

const CENTER_NAME_BY_KEY = {
  delhi: 'Delhi Center',
  hyderabad: 'Hyderabad Center',
  pune: 'Pune Center',
}

function paymentTimestamp(payment) {
  if (!payment?.paymentDate) return null
  const ts = new Date(payment.paymentDate).getTime()
  return Number.isNaN(ts) ? null : ts
}

function paymentInRange(payment, start, end) {
  const ts = paymentTimestamp(payment)
  if (ts == null) return false
  return ts >= start.getTime() && ts <= end.getTime()
}

function normalizeText(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ')
}

function courseMatchesPayment(courseName, payment) {
  const course = normalizeText(courseName)
  const paymentCourse = normalizeText(payment?.courseName || '')
  if (!course || !paymentCourse) return false
  if (paymentCourse.includes(course) || course.includes(paymentCourse)) return true
  const courseTokens = course.split(' ').filter((t) => t.length > 2)
  return courseTokens.some((token) => paymentCourse.includes(token))
}

function programMatchesPayment(programName, payment) {
  const program = normalizeText(programName)
  const category = normalizeText(payment?.courseCategory || '')
  const course = normalizeText(payment?.courseName || '')

  if (program === 'csat') {
    return course.includes('csat') && !course.includes('prelims')
  }

  const map = {
    'gs foundation': ['foundation', 'upsc', 'ncert', 'gs'],
    'optional course': ['optional', 'sociology', 'history', 'geography', 'psir', 'anthropology'],
    mentorship: ['mentorship'],
    'enrichment course': ['enrichment', 'prelims', 'booster', 'igp'],
    'test series': ['test', 'mains', 'essay', 'mirror', 'prelims and mentor'],
    books: ['book', 'bundle', 'dispatch'],
  }
  const keywords = map[program] || [program]
  return keywords.some((kw) => category.includes(kw) || course.includes(kw))
}

function sumCenterCollection(payments, centerKey, programName, courseName, start, end) {
  const centerName = CENTER_NAME_BY_KEY[centerKey]
  return payments
    .filter(
      (p) =>
        p.centerName === centerName &&
        paymentInRange(p, start, end) &&
        isPaidPayment(p) &&
        programMatchesPayment(programName, p) &&
        courseMatchesPayment(courseName, p),
    )
    .reduce((sum, p) => sum + (p.amountPaid || 0), 0)
}

function pct(collection, revenue) {
  if (!revenue) return collection > 0 ? 100 : null
  return Math.round((collection / revenue) * 100)
}

function formatPct(value) {
  return value == null ? '—' : `${value}%`
}

export function buildProgramUnitPriceTable(payments = [], filterDate = new Date()) {
  const { start, end } = getPeriodRange(startOfDay(filterDate), 'daily')
  const rows = FINANCE_PROGRAM_UNIT_PRICE_ROWS.map((row) => {
    const centers = {}
    FINANCE_UNIT_PRICE_CENTERS.forEach(({ key }) => {
      const cell = row.centers[key]
      const revenueAmount = cell?.revenueAmount ?? null
      const collectionAmount = cell?.available
        ? sumCenterCollection(payments, key, row.programName, row.courseName, start, end)
        : 0
      centers[key] = {
        available: Boolean(cell?.available),
        revenueAmount,
        collectionAmount: collectionAmount || null,
        collectedPct: pct(collectionAmount, revenueAmount),
      }
    })
    return { ...row, centers }
  })

  const programs = []
  let i = 0
  while (i < rows.length) {
    const programName = rows[i].programName
    const programRows = []
    while (i < rows.length && rows[i].programName === programName) {
      programRows.push(rows[i])
      i += 1
    }

    let revenueAmount = 0
    let collectionAmount = 0
    programRows.forEach((row) => {
      FINANCE_UNIT_PRICE_CENTERS.forEach(({ key }) => {
        const cell = row.centers[key]
        if (cell?.available && cell.revenueAmount) revenueAmount += cell.revenueAmount
        if (cell?.collectionAmount) collectionAmount += cell.collectionAmount
      })
    })

    const courses = []
    let j = 0
    while (j < programRows.length) {
      const courseName = programRows[j].courseName
      const courseRows = []
      while (j < programRows.length && programRows[j].courseName === courseName) {
        courseRows.push(programRows[j])
        j += 1
      }
      courses.push({
        courseName,
        rowSpan: courseRows.length,
        rows: courseRows,
      })
    }

    programs.push({
      programName,
      rowSpan: programRows.length,
      revenueAmount,
      collectionAmount: collectionAmount || null,
      collectedPct: pct(collectionAmount, revenueAmount),
      courses,
    })
  }

  return { programs, centers: FINANCE_UNIT_PRICE_CENTERS, formatPct }
}
