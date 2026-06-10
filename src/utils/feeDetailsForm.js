export const COURSE_CURRENCIES = [
  { value: 'INR', label: 'INR (₹)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
]

/** Parse payment bullet textarea (one point per line). */
export function parsePaymentBullets(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.replace(/^[\s•\-*]+/, '').trim())
    .filter(Boolean)
}

export function bulletsToText(list) {
  return (list || []).filter(Boolean).join('\n')
}

export function normalizePaymentBullets(list) {
  const rows = (list || []).map((t) => String(t || '').trim()).filter(Boolean)
  return rows
}

export const DEFAULT_FEE_DETAILS = {
  currency: 'INR',
  discountFee: '',
  onlinePaymentAmount: '',
  offlinePaymentAmount: '',
  onlinePaymentBullets: [],
  offlinePaymentBullets: [],
  onlinePaymentBulletsText: '',
  offlinePaymentBulletsText: '',
}

function feeFieldToInput(value) {
  if (value == null || value === '') return ''
  return String(value)
}

export function normalizeAcademicFeeDetails(fee = {}) {
  const onlinePaymentBullets = normalizePaymentBullets(
    fee.onlinePaymentBullets ?? parsePaymentBullets(fee.onlinePaymentBulletsText),
  )
  const offlinePaymentBullets = normalizePaymentBullets(
    fee.offlinePaymentBullets ?? parsePaymentBullets(fee.offlinePaymentBulletsText),
  )
  return {
    currency: fee.currency || 'INR',
    discountFee: feeFieldToInput(fee.discountFee ?? fee.discountAmount),
    onlinePaymentAmount: feeFieldToInput(
      fee.onlinePaymentAmount ?? fee.onlineAmount,
    ),
    offlinePaymentAmount: feeFieldToInput(
      fee.offlinePaymentAmount ?? fee.offlineAmount,
    ),
    onlinePaymentBullets,
    offlinePaymentBullets,
    onlinePaymentBulletsText:
      fee.onlinePaymentBulletsText ?? bulletsToText(onlinePaymentBullets),
    offlinePaymentBulletsText:
      fee.offlinePaymentBulletsText ?? bulletsToText(offlinePaymentBullets),
  }
}

export function serializeAcademicFeeDetails(fee = {}) {
  const normalized = normalizeAcademicFeeDetails(fee)
  return {
    currency: normalized.currency || 'INR',
    discountFee: Number(normalized.discountFee) || 0,
    onlinePaymentAmount: Number(normalized.onlinePaymentAmount) || 0,
    offlinePaymentAmount: Number(normalized.offlinePaymentAmount) || 0,
    onlinePaymentBullets: normalized.onlinePaymentBullets,
    offlinePaymentBullets: normalized.offlinePaymentBullets,
  }
}
