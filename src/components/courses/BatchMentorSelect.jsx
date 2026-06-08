import { useMemo } from 'react'
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
  const { options: mentorOptions } = useMentorEmployees()

  const options = useMemo(() => {
    const email = form.mentorEmail?.toLowerCase()
    if (!email || mentorOptions.some((o) => o.value === email)) return mentorOptions
    const fallbackLabel = form.mentorName
      ? formatMentorOptionLabel(
          { name: form.mentorName, employeeId: form.mentorEmployeeId },
          form.mentorRoleLabel,
        )
      : email
    return [
      {
        value: email,
        label: fallbackLabel,
        employee: {
          email,
          name: form.mentorName,
          employeeId: form.mentorEmployeeId,
        },
        roleId: form.mentorRoleId,
        roleLabel: form.mentorRoleLabel,
      },
      ...mentorOptions,
    ]
  }, [mentorOptions, form])

  const selectedValue = form.mentorEmail || ''

  const handleChange = (email) => {
    const option = options.find((o) => o.value === email)
    setForm((f) => ({
      ...f,
      ...mentorFieldsFromOption(option),
    }))
    onClearError?.()
  }

  const emptyMessage = useMemo(() => {
    if (options.length === 0) {
      return 'No active mentors — assign a mentor role in Admin Management'
    }
    return 'No mentors match your search'
  }, [options.length])

  return (
    <CourseFormField label="Mentor" required className={className}>
      <SearchableSelect
        options={options}
        value={selectedValue}
        onChange={handleChange}
        placeholder="Select mentor"
        emptyMessage={emptyMessage}
        disabled={options.length === 0}
        error={error}
        triggerClassName={mentorTriggerClass}
      />
    </CourseFormField>
  )
}
