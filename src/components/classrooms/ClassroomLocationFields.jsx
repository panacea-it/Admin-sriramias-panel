import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import SearchableSelect from '../categories/SearchableSelect'
import { CourseFormField } from '../courses/CourseFormField'
import { useClassroomLocationDropdowns } from '../../hooks/useClassroomLocationDropdowns'
import { cn } from '../../utils/cn'

export default function ClassroomLocationFields({
  centerId,
  cityPlaceId,
  classroomName,
  onCenterChange,
  onCityChange,
  errors = {},
  className,
}) {
  const { centerOptions, cityOptions, dropdownLoading, cityDropdownLoading } =
    useClassroomLocationDropdowns(centerId)

  const centerLabel = useMemo(
    () => centerOptions.find((o) => String(o.value) === String(centerId))?.label,
    [centerOptions, centerId],
  )

  const cityLabel = useMemo(
    () => cityOptions.find((o) => String(o.value) === String(cityPlaceId))?.label,
    [cityOptions, cityPlaceId],
  )

  const preview = useMemo(() => {
    const parts = [centerLabel, cityLabel, classroomName?.trim() || null].filter(Boolean)
    return parts.join(' → ')
  }, [centerLabel, cityLabel, classroomName])

  return (
    <div className={cn('space-y-4', className)}>
      <CourseFormField label="Select Centre" required>
        <SearchableSelect
          options={centerOptions}
          value={centerId}
          onChange={onCenterChange}
          placeholder="Select centre"
          emptyMessage="No centres available"
          disabled={dropdownLoading}
          error={errors.centerId}
        />
        {errors.centerId && (
          <p className="text-xs font-medium text-[#dc2626]">{errors.centerId}</p>
        )}
      </CourseFormField>

      <CourseFormField label="Select City / Place" required>
        <SearchableSelect
          options={cityOptions}
          value={cityPlaceId}
          onChange={onCityChange}
          placeholder={centerId ? 'Select city / place' : 'Select centre first'}
          emptyMessage={
            centerId ? 'No cities for this centre' : 'Select a centre first'
          }
          disabled={!centerId || dropdownLoading || cityDropdownLoading}
          error={errors.cityPlaceId}
        />
        {errors.cityPlaceId && (
          <p className="text-xs font-medium text-[#dc2626]">{errors.cityPlaceId}</p>
        )}
      </CourseFormField>

      {preview && (
        <div className="flex items-start gap-2 rounded-xl border border-[#d1e9f6] bg-[#eef6fc] px-4 py-3 text-sm text-[#1a3a5c]">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#246392]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Location preview
            </p>
            <p className="font-medium">{preview}</p>
          </div>
        </div>
      )}
    </div>
  )
}
