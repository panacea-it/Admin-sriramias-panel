import { useMemo } from 'react'
import SearchableSelect from '../categories/SearchableSelect'
import { CourseFormField } from '../courses/CourseFormField'
import { useCitiesByCenter } from '../../hooks/useCities'
import { normalizeCitiesByCenterDropdown } from '../../utils/cityApiHelpers'

export default function CityDropdown({
  centerId,
  value,
  onChange,
  error,
  label = 'Select City / Place',
  required = true,
  disabled = false,
  className,
}) {
  const normalizedCenterId = String(centerId ?? '').trim()
  const enabled = Boolean(normalizedCenterId && normalizedCenterId !== 'all')

  const { data, isLoading, isError } = useCitiesByCenter(enabled ? normalizedCenterId : undefined)

  const options = useMemo(() => normalizeCitiesByCenterDropdown(data), [data])

  const disabledSelect = disabled || !enabled

  return (
    <CourseFormField label={label} required={required} className={className}>
      <SearchableSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder={
          isLoading
            ? 'Loading cities…'
            : enabled
              ? 'Select city / place'
              : 'Select centre first'
        }
        emptyMessage={
          isError
            ? 'Failed to load cities'
            : enabled
              ? 'No cities for this centre — add places in the City tab'
              : 'Select a centre first'
        }
        disabled={disabledSelect || isLoading}
        error={error}
      />
      {error && typeof error === 'string' && (
        <p className="text-xs font-medium text-[#dc2626]">{error}</p>
      )}
    </CourseFormField>
  )
}
