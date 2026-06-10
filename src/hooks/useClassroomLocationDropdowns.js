import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '../utils/toast'
import { getApiErrorMessage, isRateLimitError } from '../utils/apiError'
import { getCentersDropdown, getCitiesByCenter } from '../services/classroomService'
import {
  normalizeCentersDropdown,
  normalizeCitiesByCenter,
} from '../utils/classroomApiHelpers'

export function useClassroomLocationDropdowns(centerId) {
  const [centerOptions, setCenterOptions] = useState([])
  const [cityOptions, setCityOptions] = useState([])
  const [dropdownLoading, setDropdownLoading] = useState(false)
  const [cityDropdownLoading, setCityDropdownLoading] = useState(false)
  const lastErrorToastAt = useRef(0)
  const mountedRef = useRef(true)

  const loadCenters = useCallback(async () => {
    setDropdownLoading(true)
    try {
      const data = await getCentersDropdown()
      if (!mountedRef.current) return
      setCenterOptions(normalizeCentersDropdown(data))
    } catch (error) {
      if (!mountedRef.current) return
      const now = Date.now()
      if (now - lastErrorToastAt.current > 4000) {
        lastErrorToastAt.current = now
        toast.error(getApiErrorMessage(error, 'Failed to load centres'))
      }
      setCenterOptions([])
    } finally {
      if (mountedRef.current) {
        setDropdownLoading(false)
      }
    }
  }, [])

  const loadCities = useCallback(async (id) => {
    const normalizedId = String(id ?? '').trim()
    if (!normalizedId || normalizedId === 'all') {
      setCityOptions([])
      return
    }

    setCityDropdownLoading(true)
    try {
      const data = await getCitiesByCenter(normalizedId)
      if (!mountedRef.current) return
      setCityOptions(normalizeCitiesByCenter(data))
    } catch (error) {
      if (!mountedRef.current) return
      if (!isRateLimitError(error)) {
        setCityOptions([])
      }
      const now = Date.now()
      if (now - lastErrorToastAt.current > 4000) {
        lastErrorToastAt.current = now
        toast.error(getApiErrorMessage(error, 'Failed to load cities'))
      }
    } finally {
      if (mountedRef.current) {
        setCityDropdownLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    loadCenters()
    return () => {
      mountedRef.current = false
    }
  }, [loadCenters])

  useEffect(() => {
    loadCities(centerId)
  }, [centerId, loadCities])

  return {
    centerOptions,
    cityOptions,
    dropdownLoading,
    cityDropdownLoading,
    reloadCities: loadCities,
  }
}
