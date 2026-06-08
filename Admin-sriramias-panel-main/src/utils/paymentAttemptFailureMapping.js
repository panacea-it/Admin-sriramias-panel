import {
  PAYMENT_FAILURE_CATEGORIES,
  PAYMENT_FAILURE_CATEGORY_STYLES,
} from '../constants/paymentAttemptConstants'

/** Gateway error code → failure category */
const ERROR_CODE_MAP = {
  E001: 'Insufficient Balance',
  E002: 'OTP Failure',
  E003: 'Gateway Timeout',
  E004: 'Bank Declined',
  E005: 'Session Expired',
  E006: 'Network Failure',
  E007: 'User Cancelled',
  E008: 'Duplicate Attempt',
  E009: 'Fraud Suspected',
  INSUFFICIENT_FUNDS: 'Insufficient Balance',
  INSUFFICIENT_BALANCE: 'Insufficient Balance',
  OTP_FAILED: 'OTP Failure',
  OTP_TIMEOUT: 'OTP Failure',
  GATEWAY_TIMEOUT: 'Gateway Timeout',
  TIMEOUT: 'Gateway Timeout',
  BANK_DECLINED: 'Bank Declined',
  DECLINED: 'Bank Declined',
  SESSION_EXPIRED: 'Session Expired',
  NETWORK_ERROR: 'Network Failure',
  USER_CANCELLED: 'User Cancelled',
  CANCELLED: 'User Cancelled',
  DUPLICATE: 'Duplicate Attempt',
  FRAUD: 'Fraud Suspected',
}

/** Keyword patterns in gateway messages / failure reasons */
const KEYWORD_PATTERNS = [
  { pattern: /insufficient|low balance|not enough funds/i, category: 'Insufficient Balance' },
  { pattern: /otp|one.?time.?password|authentication failed/i, category: 'OTP Failure' },
  { pattern: /timeout|timed out|gateway timeout/i, category: 'Gateway Timeout' },
  { pattern: /declined|rejected by bank|bank declined/i, category: 'Bank Declined' },
  { pattern: /session expired|expired session|session timeout/i, category: 'Session Expired' },
  { pattern: /network|connection|offline|dns/i, category: 'Network Failure' },
  { pattern: /cancelled|canceled|user abort|aborted/i, category: 'User Cancelled' },
  { pattern: /duplicate|already processed|idempotent/i, category: 'Duplicate Attempt' },
  { pattern: /fraud|risk|suspicious|blocked/i, category: 'Fraud Suspected' },
]

function normalizeCode(code) {
  if (!code) return ''
  return String(code).trim().toUpperCase().replace(/\s+/g, '_')
}

/**
 * Map gateway response payload to a human-readable failure category.
 * @param {{ failureReason?: string, gatewayMessage?: string, gatewayResponse?: string|object, errorCode?: string, status?: string }} input
 */
export function categorizePaymentFailure(input = {}) {
  if (input.status === 'Success') {
    return { category: null, label: 'Success', rawCode: null }
  }

  const errorCode = normalizeCode(input.errorCode)
  if (errorCode && ERROR_CODE_MAP[errorCode]) {
    return {
      category: ERROR_CODE_MAP[errorCode],
      label: ERROR_CODE_MAP[errorCode],
      rawCode: errorCode,
    }
  }

  const text = [
    input.failureReason,
    input.gatewayMessage,
    typeof input.gatewayResponse === 'string'
      ? input.gatewayResponse
      : input.gatewayResponse?.error_description || input.gatewayResponse?.description || input.gatewayResponse?.message,
    input.gatewayResponse?.error_code,
  ]
    .filter(Boolean)
    .join(' ')

  for (const { pattern, category } of KEYWORD_PATTERNS) {
    if (pattern.test(text)) {
      return { category, label: category, rawCode: errorCode || null }
    }
  }

  if (input.gatewayResponse === 'FAILED' || input.status === 'Failed') {
    return { category: 'Unknown Error', label: 'Unknown Error', rawCode: errorCode || null }
  }

  return { category: 'Unknown Error', label: 'Unknown Error', rawCode: errorCode || null }
}

export function getFailureCategoryStyle(category) {
  return PAYMENT_FAILURE_CATEGORY_STYLES[category] || PAYMENT_FAILURE_CATEGORY_STYLES['Unknown Error']
}

export function isKnownFailureCategory(category) {
  return PAYMENT_FAILURE_CATEGORIES.includes(category)
}

export function parseGatewayResponse(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return { message: String(raw) }
  }
}
