import api from '../config/api'
import { throwApiError } from '../utils/apiError'
import { createCachedRequest } from '../utils/apiRequestCache'

const citiesListCache = createCachedRequest({ ttlMs: 30_000 })

export function clearCitiesListCache() {
  citiesListCache.clear()
}

function invalidateCitiesListCache() {
  clearCitiesListCache()
}

export async function getCities(params = {}, { bypassCache = false } = {}) {
  try {
    return await citiesListCache.fetch(
      params,
      async () => {
        const response = await api.get('/api/cities', { params })
        return response.data
      },
      { bypass: bypassCache },
    )
  } catch (error) {
    throwApiError(error)
  }
}

export async function getCityById(cityId) {
  try {
    const response = await api.get(`/api/cities/${cityId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function createCity(payload) {
  try {
    const response = await api.post('/api/cities', payload)
    invalidateCitiesListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateCity(cityId, payload) {
  try {
    const response = await api.put(`/api/cities/${cityId}`, payload)
    invalidateCitiesListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateCityStatus(cityId, status) {
  try {
    const response = await api.patch(`/api/cities/status/${cityId}`, { status })
    invalidateCitiesListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteCity(cityId) {
  try {
    const response = await api.delete(`/api/cities/${cityId}`)
    invalidateCitiesListCache()
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
