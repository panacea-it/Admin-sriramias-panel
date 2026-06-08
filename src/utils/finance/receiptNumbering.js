import { CENTER_TO_BRANCH_CODE } from '../../constants/receiptConstants'
import { getFinancialYearShort } from './receiptGst'

export function resolveBranchCode(row, gstSettings = {}) {
  const centerName = row.centerName || row.branch || ''
  const branches = gstSettings.branchGst || []
  const branchMatch = branches.find(
    (b) => b.branchName === centerName || b.centerName === centerName,
  )
  if (branchMatch?.branchCode) return branchMatch.branchCode
  if (branchMatch?.branchId && CENTER_TO_BRANCH_CODE[branchMatch.branchId]) {
    return CENTER_TO_BRANCH_CODE[branchMatch.branchId]
  }
  if (CENTER_TO_BRANCH_CODE[centerName]) return CENTER_TO_BRANCH_CODE[centerName]
  if (row.branchCode) return row.branchCode
  const code = centerName.replace(/Center|HQ/gi, '').trim().slice(0, 3).toUpperCase()
  return code || 'SRI'
}

export function formatSequenceNumber(n, pad = 5) {
  return String(n).padStart(pad, '0')
}

export function buildInvoiceNumber(branchCode, sequence, options = {}) {
  const fy = options.financialYear ?? getFinancialYearShort(options.date)
  const code = branchCode || 'SRI'
  return `${code}-INV-${fy}-${formatSequenceNumber(sequence)}`
}

export function buildBranchReceiptNumber(branchCode, sequence, options = {}) {
  const fy = options.financialYear ?? getFinancialYearShort(options.date)
  const code = branchCode || 'SRI'
  return `${code}-RCP-${fy}-${formatSequenceNumber(sequence)}`
}

export function previewInvoiceNumber(row, gstSettings = {}, sequence = 1) {
  const branchCode = resolveBranchCode(row, gstSettings)
  const fy = gstSettings.financialYear ?? getFinancialYearShort()
  return buildInvoiceNumber(branchCode, sequence, { financialYear: fy })
}

export function previewReceiptNumber(row, gstSettings = {}, sequence = 1) {
  const branchCode = resolveBranchCode(row, gstSettings)
  const fy = gstSettings.financialYear ?? getFinancialYearShort()
  return buildBranchReceiptNumber(branchCode, sequence, { financialYear: fy })
}

/** In-memory sequence store key for mock/API */
export function sequenceKey(branchCode, financialYear) {
  return `${branchCode}:${financialYear}`
}
