import { useCallback, useEffect, useState } from 'react'
import { getApiErrorMessage } from '../utils/apiError'
import { toast } from '../utils/toast'
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

  const loadCenters = useCallback(async () => {
    setDropdownLoading(true)
    try {
      const data = await getCentersDropdown()
      setCenterOptions(normalizeCentersDropdown(data))
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load centres'))
      setCenterOptions([])
    } finally {
      setDropdownLoading(false)
    }
  }, [])

  const loadCities = useCallback(async (id) => {
    if (!id) {
      setCityOptions([])
      return
    }
    setCityDropdownLoading(true)
    try {
      const data = await getCitiesByCenter(id)
      setCityOptions(normalizeCitiesByCenter(data))
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load cities'))
      setCityOptions([])
    } finally {
      setCityDropdownLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCenters()
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
