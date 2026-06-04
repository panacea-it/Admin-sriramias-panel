/** Place templates — centerId resolved at runtime from Centre Management */
export const CITIES_SEED_TEMPLATE = [
  { centerCode: 'DLH', placeName: 'NCR', code: 'DEL-NCR-01', status: 'Active' },
  { centerCode: 'DLH', placeName: 'Karol Bagh', code: 'DEL-KB-01', status: 'Active' },
  { centerCode: 'HYD', placeName: 'Kukatpally', code: 'HYD-KKP-01', status: 'Active' },
  { centerCode: 'HYD', placeName: 'Madhapur', code: 'HYD-MDP-01', status: 'Active' },
  { centerCode: 'BLR', placeName: 'Indiranagar', code: 'BLR-IND-01', status: 'Active' },
]

export function seedCitiesFromCenters(centers, ts) {
  const centerList = Array.isArray(centers) ? centers : []
  const now = ts || new Date().toISOString()
  let idx = 0
  return CITIES_SEED_TEMPLATE.map((row) => {
    const center = centerList.find((c) => c.centerCode === row.centerCode)
    if (!center) return null
    idx += 1
    return {
      id: `city-${String(idx).padStart(3, '0')}`,
      centerId: center.centerId,
      centerName: center.centerName,
      placeName: row.placeName,
      code: row.code,
      status: row.status === 'Inactive' ? 'Inactive' : 'Active',
      createdAt: now,
      modifiedAt: now,
    }
  }).filter(Boolean)
}
