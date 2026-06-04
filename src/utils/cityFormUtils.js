export const EMPTY_CITY_FORM = {
  centerId: '',
  placeName: '',
}

export function cityToForm(city) {
  if (!city) return { ...EMPTY_CITY_FORM }
  return {
    centerId: city.centerId || '',
    placeName: city.placeName || city.cityAddress || '',
  }
}
