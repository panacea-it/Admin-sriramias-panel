import {
  FINANCE_PAYMENT_MODE_CATEGORIES,
  FINANCE_PAYMENT_MODE_LEGACY_MAP,
  FINANCE_STANDARD_PAYMENT_MODES,
} from '../../constants/financeConstants'

/** Normalize legacy payment mode strings to standardized labels */
export function normalizePaymentModeLabel(mode) {
  if (!mode) return '—'
  const trimmed = String(mode).trim()
  return FINANCE_PAYMENT_MODE_LEGACY_MAP[trimmed] || trimmed
}

export function paymentModeLabelToId(label, settings = []) {
  const normalized = normalizePaymentModeLabel(label)
  const pool = settings.length ? settings : FINANCE_STANDARD_PAYMENT_MODES
  return pool.find((m) => m.label === normalized)?.id || null
}

export function getCategoryLabel(categoryId) {
  return FINANCE_PAYMENT_MODE_CATEGORIES.find((c) => c.id === categoryId)?.label || categoryId || 'Other'
}

export function generatePaymentModeId(label) {
  const slug = String(label)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return `custom_${slug || 'mode'}_${Date.now()}`
}

export function getEnabledModeLabels(settings = []) {
  return settings.filter((m) => m.enabled).map((m) => m.label)
}

export function isModeEnabledForRecord(mode, settings = []) {
  if (!settings.length) return true
  const label = normalizePaymentModeLabel(mode)
  const entry = settings.find((s) => s.label === label || s.id === paymentModeLabelToId(label, settings))
  return entry ? entry.enabled : true
}

export function buildPaymentModeFilterOptions(settings = [], includeAll = true) {
  const enabled = settings.length ? settings.filter((m) => m.enabled) : FINANCE_STANDARD_PAYMENT_MODES
  const options = enabled.map((m) => ({ value: m.label, label: m.label }))
  return includeAll ? [{ value: 'all', label: 'All modes' }, ...options] : options
}

export function filterAndSortPaymentModes(modes = [], { search = '', category = 'all', status = 'all', sort = 'name' } = {}) {
  let list = [...modes]
  const q = search.trim().toLowerCase()

  if (q) {
    list = list.filter(
      (m) =>
        m.label?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        getCategoryLabel(m.category).toLowerCase().includes(q),
    )
  }
  if (category && category !== 'all') {
    list = list.filter((m) => m.category === category)
  }
  if (status === 'active') list = list.filter((m) => m.enabled)
  if (status === 'inactive') list = list.filter((m) => !m.enabled)

  if (sort === 'updated') {
    list.sort((a, b) => new Date(b.lastUpdated || 0) - new Date(a.lastUpdated || 0))
  } else {
    list.sort((a, b) => String(a.label).localeCompare(String(b.label)))
  }

  return list
}

export function groupPaymentModesByCategory(modes = []) {
  const groups = {}
  FINANCE_PAYMENT_MODE_CATEGORIES.forEach((cat) => {
    groups[cat.id] = []
  })
  modes.forEach((mode) => {
    const key = groups[mode.category] ? mode.category : 'other'
    if (!groups[key]) groups[key] = []
    groups[key].push(mode)
  })
  return FINANCE_PAYMENT_MODE_CATEGORIES.map((cat) => ({
    category: cat,
    modes: groups[cat.id] || [],
  })).filter((g) => g.modes.length > 0)
}

export function validatePaymentModeForm(form, existingModes = [], editingId = null) {
  const errors = {}
  const label = form.label?.trim()
  if (!label) errors.label = 'Payment mode name is required'
  else if (label.length < 2) errors.label = 'Name must be at least 2 characters'
  else {
    const duplicate = existingModes.find(
      (m) => m.label.toLowerCase() === label.toLowerCase() && m.id !== editingId,
    )
    if (duplicate) errors.label = 'A payment mode with this name already exists'
  }
  if (!form.category) errors.category = 'Category is required'
  return errors
}

export function createPaymentModeFromForm(form) {
  const now = new Date().toISOString()
  return {
    id: generatePaymentModeId(form.label),
    label: form.label.trim(),
    category: form.category,
    description: form.description?.trim() || '',
    icon: form.icon || 'circle-dot',
    enabled: form.enabled !== false,
    isCustom: true,
    lastUpdated: now,
  }
}
