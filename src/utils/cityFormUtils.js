import { getCityDisplayCode } from './cityApiHelpers'

export const EMPTY_CITY_FORM = {
  centerId: '',
  placeName: '',
  code: '',
}

export function cityToForm(city) {
  if (!city) return { ...EMPTY_CITY_FORM }
  const code = getCityDisplayCode(city)
  return {
    centerId: city.centerId || '',
    placeName: city.placeName || city.cityAddress || '',
    code: code || '',
  }
}