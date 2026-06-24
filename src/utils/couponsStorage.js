import { INITIAL_COUPONS } from '../data/couponsData'

const STORAGE_KEY = 'sriram_coupons_v1'

function expiresOnToIso(expiresOn) {
  if (!expiresOn || expiresOn === '—') return ''
  const [d, m, y] = String(expiresOn).split('/')
  if (!d || !m || !y) return ''
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function isoToExpiresOn(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y) return iso
  return `${d}/${m}/${y}`
}

function normalizeCoupon(row) {
  return {
    id: row.id,
    name: String(row.name || row.couponName || '').trim(),
    type: row.type || 'Percentage',
    redemptions: Number(row.redemptions) || 0,
    expiresOn: row.expiresOn || isoToExpiresOn(row.validTill),
    status: row.status === 'In Active' ? 'In Active' : 'Active',
    topPerforming: Boolean(row.topPerforming),
    couponCode: String(row.couponCode || `CPN-${row.id}`).trim(),
    value: String(row.value ?? '').trim(),
    validFrom: row.validFrom || '',
    validTill: row.validTill || expiresOnToIso(row.expiresOn),
    category: row.category || 'Course',
    backgroundImage: row.backgroundImage || '',
    totalUsersLimit: String(row.totalUsersLimit ?? '').trim(),
    usageLimitPerCustomer: String(row.usageLimitPerCustomer ?? '').trim(),
    minQuantityItems: String(row.minQuantityItems ?? '').trim(),
    minCartValue: String(row.minCartValue ?? '').trim(),
    eligibility: row.eligibility || 'everyone',
    specificStudent: row.specificStudent || '',
  }
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeStored(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function loadCoupons() {
  const stored = readStored()
  if (stored?.length) return stored.map(normalizeCoupon)
  const seed = INITIAL_COUPONS.map(normalizeCoupon)
  writeStored(seed)
  return seed
}

export function saveCoupons(list) {
  const normalized = list.map(normalizeCoupon)
  writeStored(normalized)
  return normalized
}

export function createCoupon(form) {
  const list = loadCoupons()
  const coupon = normalizeCoupon({
    id: Date.now(),
    name: form.couponName,
    couponCode: form.couponCode,
    type: form.type,
    value: form.value,
    validFrom: form.validFrom,
    validTill: form.validTill,
    expiresOn: isoToExpiresOn(form.validTill),
    category: form.category,
    backgroundImage: form.backgroundImage,
    totalUsersLimit: form.totalUsersLimit,
    usageLimitPerCustomer: form.usageLimitPerCustomer,
    minQuantityItems: form.minQuantityItems,
    minCartValue: form.minCartValue,
    eligibility: form.eligibility,
    specificStudent: form.specificStudent,
    redemptions: 0,
    status: 'Active',
    topPerforming: false,
  })
  const next = [coupon, ...list]
  saveCoupons(next)
  return { ok: true, coupon }
}

export function updateCoupon(id, form) {
  const list = loadCoupons()
  const idx = list.findIndex((c) => String(c.id) === String(id))
  if (idx < 0) return { ok: false, reason: 'Coupon not found' }
  const updated = normalizeCoupon({
    ...list[idx],
    name: form.couponName,
    couponCode: form.couponCode,
    type: form.type,
    value: form.value,
    validFrom: form.validFrom,
    validTill: form.validTill,
    expiresOn: isoToExpiresOn(form.validTill),
    category: form.category,
    backgroundImage: form.backgroundImage,
    totalUsersLimit: form.totalUsersLimit,
    usageLimitPerCustomer: form.usageLimitPerCustomer,
    minQuantityItems: form.minQuantityItems,
    minCartValue: form.minCartValue,
    eligibility: form.eligibility,
    specificStudent: form.specificStudent,
  })
  const next = [...list]
  next[idx] = updated
  saveCoupons(next)
  return { ok: true, coupon: updated }
}

export function updateCouponStatus(id, active) {
  const list = loadCoupons()
  const idx = list.findIndex((c) => String(c.id) === String(id))
  if (idx < 0) return { ok: false, reason: 'Coupon not found' }
  const next = [...list]
  next[idx] = { ...next[idx], status: active ? 'Active' : 'In Active' }
  saveCoupons(next)
  return { ok: true, coupon: next[idx] }
}

export function deleteCoupon(id) {
  const list = loadCoupons()
  const next = list.filter((c) => String(c.id) !== String(id))
  if (next.length === list.length) return { ok: false, reason: 'Coupon not found' }
  saveCoupons(next)
  return { ok: true }
}

export function couponToForm(coupon) {
  if (!coupon) return null
  function isoToInputDate(iso) {
    if (!iso) return ''
    // handle ISO datetimes like 2026-06-01T00:00:00.000Z or date-only 'YYYY-MM-DD'
    const d = String(iso).split('T')[0]
    return d || ''
  }
  return {
    couponName: coupon.name || '',
    couponCode: coupon.couponCode || '',
    type: coupon.type || 'Percentage',
    value: String(coupon.value ?? '').trim(),
    validFrom: isoToInputDate(coupon.validFrom) || '',
    validTill: isoToInputDate(coupon.validTill) || expiresOnToIso(coupon.expiresOn),
    category: coupon.category || 'Course',
    backgroundImage:
      (coupon.backgroundImage && typeof coupon.backgroundImage === 'object'
        ? coupon.backgroundImage.url || coupon.backgroundImage.public_id || ''
        : coupon.backgroundImage) || '',
    totalUsersLimit: String(coupon.totalUsersLimit ?? '').trim(),
    usageLimitPerCustomer: String(coupon.usageLimitPerCustomer ?? '').trim(),
    minQuantityItems: String(coupon.minQuantityItems ?? '').trim(),
    minCartValue: String(coupon.minCartValue ?? '').trim(),
    eligibility: coupon.eligibility || 'everyone',
    specificStudent: coupon.specificStudent || '',
  }
}
