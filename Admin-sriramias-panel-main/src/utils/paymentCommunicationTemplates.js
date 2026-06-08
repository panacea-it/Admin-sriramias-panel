/** Template variable substitution & preview helpers */

const SAMPLE_VALUES = {
  '{{student_name}}': 'Aarav Sharma',
  '{{amount_due}}': '₹25,000',
  '{{due_date}}': '15 Jun 2026',
  '{{payment_link}}': 'https://pay.sriramias.com/abc123',
  '{{transaction_id}}': 'TXN-2026-004521',
  '{{refund_amount}}': '₹5,000',
  '{{emi_due_date}}': '01 Jun 2026',
}

export function applyTemplateVariables(text, overrides = {}) {
  if (!text) return ''
  let result = text
  Object.entries({ ...SAMPLE_VALUES, ...overrides }).forEach(([key, val]) => {
    result = result.replaceAll(key, val)
  })
  return result
}

export function extractTemplateVariables(text) {
  if (!text) return []
  const matches = text.match(/\{\{[a-z_]+\}\}/g)
  return matches ? [...new Set(matches)] : []
}
