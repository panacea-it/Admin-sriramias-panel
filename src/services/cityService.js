import api from './api'
import { throwApiError } from '../utils/apiError'

const CITIES_BASE = '/api/cities'

function stripEmptyParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value != null && value !== ''),
  )
}

/** @param {import('../types/city.types').CityListParams} [params] */
export async function getCities(params = {}) {
  try {
    const { data } = await api.get(CITIES_BASE, { params: stripEmptyParams(params) })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getCityById(cityId) {
  try {
    const { data } = await api.get(`${CITIES_BASE}/${cityId}`)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

/** @param {import('../types/city.types').CreateCityPayload} payload */
export async function createCity(payload) {
  try {
    const { data } = await api.post(CITIES_BASE, payload)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

/** @param {import('../types/city.types').UpdateCityPayload} payload */
export async function updateCity(cityId, payload) {
  try {
    const { data } = await api.put(`${CITIES_BASE}/${cityId}`, payload)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

/** @param {import('../types/city.types').CityStatus} status */
export async function updateCityStatus(cityId, status) {
  try {
    const { data } = await api.patch(`${CITIES_BASE}/status/${cityId}`, { status })
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteCity(cityId) {
  try {
    const { data } = await api.delete(`${CITIES_BASE}/${cityId}`)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export async function getCitiesByCenter(centerId) {
  const key = String(centerId ?? '').trim()
  if (!key || key === 'all') {
    return { success: true, count: 0, data: [] }
  }

  try {
    const { data } = await api.get(`${CITIES_BASE}/by-center/${key}`)
    return data
  } catch (error) {
    throwApiError(error)
  }
}

export const cityService = {
  getCities,
  getCityById,
  createCity,
  updateCity,
  updateCityStatus,
  deleteCity,
  getCitiesByCenter,
}

export default cityService
