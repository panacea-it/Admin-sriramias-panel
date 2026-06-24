import BatchFormSection from './BatchFormSection'
import { CourseFormField, CourseInput } from './CourseFormField'

/**
 * Standardized editable section heading for Add/Edit Course marketing sections.
 * Preview card + labeled full-width input (matches Why Choose Section Title style).
 */
export default function EditableSectionTitleField({
  sectionHeader,
  fieldLabel = 'Section Title',
  value = '',
  onChange,
  placeholder = '',
  defaultDisplayValue = '',
  previewSubtitle,
  'aria-label': ariaLabel,
}) {
  const previewTitle = String(value ?? '').trim() || defaultDisplayValue || placeholder

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 text-center shadow-sm">
        {sectionHeader ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {sectionHeader}
          </p>
        ) : null}
        <h3 className="text-base font-bold tracking-tight text-[#246392] sm:text-lg">
          {previewTitle}
        </h3>
        {previewSubtitle ? (
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">{previewSubtitle}</p>
        ) : null}
      </div>

      <BatchFormSection>
        <CourseFormField label={fieldLabel}>
          <CourseInput
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || defaultDisplayValue}
            aria-label={ariaLabel || fieldLabel}
          />
        </CourseFormField>
      </BatchFormSection>
    </div>
  )
}
