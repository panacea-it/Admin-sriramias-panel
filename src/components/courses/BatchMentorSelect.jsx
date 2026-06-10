import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import SearchableSelect from '../categories/SearchableSelect'
import { CourseFormField } from './CourseFormField'
import { useMentorEmployees } from '../../hooks/useMentorEmployees'
import {
  formatMentorOptionLabel,
  mentorFieldsFromOption,
} from '../../utils/mentorEmployees'
import { cn } from '../../utils/cn'

const mentorTriggerClass = cn(
  'flex h-12 min-h-[48px] w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 text-left text-sm text-gray-800 shadow-sm outline-none transition duration-150',
  'hover:border-[#93c5fd] hover:bg-[#fafcff]',
  'focus:border-[#55ace7] focus:bg-white focus:ring-2 focus:ring-blue-400/35',
)

export default function BatchMentorSelect({ form, setForm, error, onClearError, className }) {
  const { options: mentorOptions, loading } = useMentorEmployees({ enabled: true })

  const options = useMemo(() => {
    const mentorId = String(form.mentorId || '').trim()
    if (!mentorId || mentorOptions.some((o) => o.value === mentorId)) return mentorOptions
    const fallbackLabel = form.mentorName
      ? formatMentorOptionLabel(
          { name: form.mentorName, employeeId: form.mentorEmployeeId },
          form.mentorRoleLabel,
        )
      : mentorId
    return [
      {
        value: mentorId,
        label: fallbackLabel,
        employee: {
          _id: mentorId,
          email: form.mentorEmail,
          name: form.mentorName,
          employeeId: form.mentorEmployeeId,
        },
        roleId: form.mentorRoleId,
        roleLabel: form.mentorRoleLabel,
      },
      ...mentorOptions,
    ]
  }, [mentorOptions, form])

  const selectedValue = form.mentorId || ''

  const handleChange = (mentorId) => {
    const option = options.find((o) => o.value === mentorId)
    setForm((f) => ({
      ...f,
      ...mentorFieldsFromOption(option),
    }))
    onClearError?.()
  }

  const emptyMessage = useMemo(() => {
    if (loading) return 'Loading mentors…'
    if (options.length === 0) {
      return 'No active mentors — assign a mentor role in Admin Management'
    }
    return 'No mentors match your search'
  }, [loading, options.length])

  return (
    <CourseFormField label="Mentor" required className={className}>
      <div className="relative">
        <SearchableSelect
          options={options}
          value={selectedValue}
          onChange={handleChange}
          placeholder={loading ? 'Loading mentors…' : 'Select mentor'}
          emptyMessage={emptyMessage}
          disabled={loading || options.length === 0}
          error={error}
          triggerClassName={mentorTriggerClass}
        />
        {loading && (
          <Loader2 className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#55ace7]" />
        )}
      </div>
    </CourseFormField>
  )
}
