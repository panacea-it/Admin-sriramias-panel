export const EMPTY_CITY_FORM = {
  centerId: '',
  placeName: '',
  code: '',
}

export function cityToForm(city) {
  if (!city) return { ...EMPTY_CITY_FORM }
  const code = String(city.code || city.cityCode || '').trim()
  return {
    centerId: city.centerId || '',
    placeName: city.placeName || city.cityAddress || '',
    code: code ? code.toUpperCase() : '',
  }
}
