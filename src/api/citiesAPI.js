import {
  createCity,
  deleteCity as deleteCityApi,
  getCities,
  getCityById,
  updateCity,
  updateCityStatus,
  getCitiesByCenter,
} from '../services/cityService'
import {
  buildCreateCityPayload,
  buildUpdateCityPayload,
  mapApiCityToLocal,
  normalizeCitiesListResponse,
} from '../utils/cityApiHelpers'

export async function fetchCities({ page = 1, limit = 10, search = '', center, status, signal } = {}) {
  const params = { page, limit }
  if (search) params.search = search
  if (center && center !== 'all') params.center = center
  if (status && status !== 'all') params.status = status

  const data = await getCities(params)
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return normalizeCitiesListResponse(data, { page, limit }).items
}

export async function fetchCityById(cityId) {
  const data = await getCityById(cityId)
  return mapApiCityToLocal(data)
}

export async function fetchCitiesByCenter(centerId) {
  const data = await getCitiesByCenter(centerId)
  return data?.data ?? []
}

export async function saveCity(payload, { isEdit, id } = {}) {
  if (isEdit && id) {
    const data = await updateCity(id, buildUpdateCityPayload(payload))
    return mapApiCityToLocal(data)
  }

  const data = await createCity(buildCreateCityPayload(payload))
  return mapApiCityToLocal(data)
}

export async function deleteCity(id) {
  await deleteCityApi(id)
}

export async function toggleCityStatus(id, nextStatus) {
  const data = await updateCityStatus(id, nextStatus)
  return mapApiCityToLocal(data)
}
