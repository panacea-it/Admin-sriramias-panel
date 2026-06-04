/** GSTIN format: 15 chars — 2 state + 10 PAN + entity + Z + checksum */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export function isValidGstin(value) {
  if (!value || typeof value !== 'string') return false
  return GSTIN_REGEX.test(value.trim().toUpperCase())
}

export function gstinValidationMessage(value) {
  if (!value?.trim()) return 'GSTIN is required when GST is enabled'
  if (!isValidGstin(value)) return 'Invalid GSTIN format (15 characters, e.g. 29ABCDE1234F1Z5)'
  return null
}
