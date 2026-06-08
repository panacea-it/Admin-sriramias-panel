import { useEffect, useMemo, useState } from 'react'
import SearchableSelect from '../categories/SearchableSelect'
import { CourseFormField } from '../courses/CourseFormField'
import { getCitiesForCenter } from '../../utils/citiesStorage'

export default function CityDropdown({
  centerId,
  value,
  onChange,
  error,
  label = 'Select City / Place',
  required = true,
  disabled = false,
  activeOnly = true,
  className,
}) {
  const [cities, setCities] = useState([])

  useEffect(() => {
    const refresh = () => {
      setCities(getCitiesForCenter(centerId, { activeOnly }))
    }
    refresh()
    window.addEventListener('cities-updated', refresh)
    return () => window.removeEventListener('cities-updated', refresh)
  }, [centerId, activeOnly])

  const options = useMemo(
    () =>
      cities.map((c) => ({
        value: c.id,
        label: c.placeName,
      })),
    [cities],
  )

  const disabledSelect = disabled || !centerId

  return (
    <CourseFormField label={label} required={required} className={className}>
      <SearchableSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder={centerId ? 'Select city / place' : 'Select centre first'}
        emptyMessage={
          centerId
            ? 'No cities for this centre — add places in the City tab'
            : 'Select a centre first'
        }
        disabled={disabledSelect}
        error={error}
      />
      {error && typeof error === 'string' && (
        <p className="text-xs font-medium text-[#dc2626]">{error}</p>
      )}
    </CourseFormField>
  )
}
