import { useMemo } from 'react'
import { useCentersDropdownOptions } from './useCentersDropdownOptions'
import { useCitiesByCenter } from './useCities'
import { normalizeCitiesByCenter } from '../utils/classroomApiHelpers'

export function useClassroomLocationDropdowns(centerId) {
  const { options: centerOptions, loading: dropdownLoading } = useCentersDropdownOptions()

  const normalizedCenterId = String(centerId ?? '').trim()
  const hasCenter = Boolean(normalizedCenterId && normalizedCenterId !== 'all')

  const { data: citiesData, isLoading: cityDropdownLoading } = useCitiesByCenter(
    hasCenter ? normalizedCenterId : undefined,
    { enabled: hasCenter },
  )

  const cityOptions = useMemo(() => normalizeCitiesByCenter(citiesData), [citiesData])

  return {
    centerOptions,
    cityOptions,
    dropdownLoading,
    cityDropdownLoading,
  }
}
