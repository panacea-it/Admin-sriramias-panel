import api from '../config/api'
import { throwApiError } from '../utils/apiError'

export async function getCities(params = {}) {
  try {
    const response = await api.get('/api/cities', { params })
    return response.data
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
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateCity(cityId, payload) {
  try {
    const response = await api.put(`/api/cities/${cityId}`, payload)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function updateCityStatus(cityId, status) {
  try {
    const response = await api.patch(`/api/cities/status/${cityId}`, { status })
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}

export async function deleteCity(cityId) {
  try {
    const response = await api.delete(`/api/cities/${cityId}`)
    return response.data
  } catch (error) {
    throwApiError(error)
  }
}
