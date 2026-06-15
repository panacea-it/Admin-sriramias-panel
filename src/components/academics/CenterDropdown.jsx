import { useCentersDropdownOptions } from '../../hooks/useCentersDropdownOptions'
import SearchableSelect from '../categories/SearchableSelect'
import { CourseFormField } from '../courses/CourseFormField'

export default function CenterDropdown({
  value,
  onChange,
  error,
  label = 'Select Centre',
  required = true,
  disabled = false,
  className,
}) {
  const { options, loading } = useCentersDropdownOptions()

  return (
    <CourseFormField label={label} required={required} className={className}>
      <SearchableSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder="Select centre"
        emptyMessage="No centres available — add one in Centre Management"
        disabled={disabled || loading}
        error={error}
      />
    </CourseFormField>
  )
}
