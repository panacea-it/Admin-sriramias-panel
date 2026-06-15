import axiosInstance from './axiosInstance'
// use axiosInstance whdich attaches Authorization header

function mapAdminCoupon(row) {
  const type = String(row.type || '').toUpperCase()
  const status = String(row.status || '').toUpperCase()
  const couponId = row._id || row.id

  return {
    id: couponId,
    _id: couponId,
    couponId,
    name: String(row.couponName || row.name || '').trim(),
    couponCode: String(row.couponCode || '').trim(),
    type:
      type === 'FLAT'
        ? 'Flat Discount'
        : type === 'PERCENTAGE'
          ? 'Percentage'
          : row.type || 'Percentage',
    value: row.value ?? '',
    validFrom: row.validFrom || '',
    validTill: row.validTill || '',
    expiresOn: row.validTill ? new Date(row.validTill).toLocaleDateString('en-GB') : '—',
    category: row.applicableFor || row.category || 'Course',
    backgroundImage:
      row.backgroundImage && typeof row.backgroundImage === 'object'
        ? row.backgroundImage.url || row.backgroundImage.public_id || ''
        : row.backgroundImage || '',
    totalUsersLimit: row.totalUsersLimit ?? '',
    usageLimitPerCustomer: row.usageLimitPerCustomer ?? '',
    minQuantityItems: row.minimumQuantity ?? '',
    minCartValue: row.minimumCartValue ?? '',
    eligibility: row.eligibility || 'everyone',
    specificStudent: row.specificStudent || '',
    redemptions: Number(row.usedCount ?? 0),
    status: status === 'ACTIVE' ? 'Active' : status === 'INACTIVE' ? 'In Active' : row.status || 'Active',
    topPerforming: Boolean(row.topPerforming),
    createdBy: row.createdBy || null,
    createdAt: row.createdAt || null,
  }
}

export async function fetchAdminCoupons(signal) {
  const response = await axiosInstance.get('/coupons/admin', { signal })
  const rows = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : []

  return rows.map(mapAdminCoupon)
}

export async function fetchCouponsByCategory(categoryId, signal) {
  if (!categoryId) return []
  const response = await axiosInstance.get('/coupons', {
    params: { categoryId },
    signal,
  })
  const rows = Array.isArray(response?.data?.data)
    ? response.data.data
    : Array.isArray(response?.data)
      ? response.data
      : []

  return rows.map(mapAdminCoupon)
}

export async function deleteAdminCoupon(id, signal) {
  const couponId = String(id || '').trim()
  if (!couponId) {
    throw new Error('Coupon id is missing for delete request.')
  }

  const response = await axiosInstance.delete(`/coupons/admin/${encodeURIComponent(couponId)}`, { signal })
  return response.data
}

export async function createAdminCoupon(form, signal) {
  const fd = new FormData()
  Object.entries(form || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    // Only send actual File objects for file fields. Skip sending string paths for backgroundImage
    if (k === 'backgroundImage' && typeof v === 'string') return
    if (typeof File !== 'undefined' && v instanceof File) {
      fd.append(k, v)
    } else if (Array.isArray(v)) {
      v.forEach((item) => fd.append(k, item))
    } else {
      fd.append(k, String(v))
    }
  })
  if (import.meta.env.DEV) {
    try {
      // eslint-disable-next-line no-console
      console.debug('Creating coupon - FormData entries:')
      for (const entry of fd.entries()) {
        // entry is [key, value]
        const [key, value] = entry
        // eslint-disable-next-line no-console
        console.debug(key, value && value.name ? `(File) ${value.name}` : String(value))
      }
    } catch (e) {
      // ignore
    }
  }

  const response = await axiosInstance.post('/coupons/admin', fd, { signal })
  return response.data
}

export async function updateAdminCoupon(id, form, signal) {
  const couponId = String(id || '').trim()
  if (!couponId) throw new Error('Coupon id is missing for update request.')

  const fd = new FormData()
  Object.entries(form || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return
    if (v instanceof File) {
      fd.append(k, v)
    } else if (Array.isArray(v)) {
      v.forEach((item) => fd.append(k, item))
    } else {
      fd.append(k, String(v))
    }

    if (import.meta.env.DEV) {
      try {
        // eslint-disable-next-line no-console
        console.debug('Updating coupon', couponId, '- FormData entries:')
        for (const entry of fd.entries()) {
          const [key, value] = entry
          // eslint-disable-next-line no-console
          console.debug(key, value && value.name ? `(File) ${value.name}` : String(value))
        }
      } catch (e) {
        // ignore
      }
    }

  })

  const response = await axiosInstance.put(`/coupons/admin/${encodeURIComponent(couponId)}`, fd, { signal })
  return response.data
}
