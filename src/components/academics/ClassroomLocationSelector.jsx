import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import CenterDropdown from './CenterDropdown'
import CityDropdown from './CityDropdown'
import { findCityById } from '../../utils/citiesStorage'
import { useCenters } from '../../contexts/CentersContext'
import { cn } from '../../utils/cn'

export default function ClassroomLocationSelector({
  centerId,
  cityPlaceId,
  classroomName,
  onCenterChange,
  onCityChange,
  errors = {},
  className,
}) {
  const { activeCenters } = useCenters()
  const city = cityPlaceId ? findCityById(cityPlaceId) : null
  const centreList = Array.isArray(activeCenters) ? activeCenters : []
  const center = centreList.find((c) => String(c.centerId) === String(centerId))

  const preview = useMemo(() => {
    const parts = [
      center?.centerName,
      city?.placeName || null,
      classroomName?.trim() || null,
    ].filter(Boolean)
    return parts.join(' → ')
  }, [center?.centerName, city, classroomName])

  return (
    <div className={cn('space-y-4', className)}>
      <CenterDropdown
        value={centerId}
        onChange={onCenterChange}
        error={errors.centerId}
      />
      <CityDropdown
        centerId={centerId}
        value={cityPlaceId}
        onChange={onCityChange}
        error={errors.cityPlaceId}
      />
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
