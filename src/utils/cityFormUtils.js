import { mapApiCityStatusToUi } from './cityApiHelpers'

export const EMPTY_CITY_FORM = {
  centerId: '',
  cityAddress: '',
  status: 'Active',
}

export function cityToForm(city) {
  if (!city) return { ...EMPTY_CITY_FORM }
  return {
    centerId: city.centerId || '',
    cityAddress: city.cityAddress || city.placeName || '',
    status: mapApiCityStatusToUi(city.status) || 'Active',
  }
}
