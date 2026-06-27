import { AnimatePresence, motion } from 'framer-motion'
import {
  CURRENT_AFFAIRS_FIELD_LAYOUT,
  CURRENT_AFFAIRS_FORM_CATEGORIES,
  getFieldLabel,
  MAINS_CATEGORY_OPTIONS,
} from '../../constants/currentAffairsForm'
import { MONTH_OPTIONS } from '../../data/currentAffairsData'
import { getCurrentAffairsYearOptions } from '../../utils/currentAffairsYearOptions'
import { CourseFormField, CourseInput, CourseSelect } from '../courses/CourseFormField'
import { getDaySelectOptions } from '../../utils/currentAffairsDateHelpers'
import CurrentAffairsFileField from './CurrentAffairsFileField'
import CurrentAffairsSampleFileField from './CurrentAffairsSampleFileField'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>
}

function gridColsClass(count) {
  if (count >= 3) return 'sm:grid-cols-2 lg:grid-cols-3'
  if (count === 2) return 'sm:grid-cols-2'
  return 'sm:grid-cols-1'
}

export default function CurrentAffairsFormFields({
  form,
  errors,
  fileInputKey,
  sampleFileInputKey,
  onCategoryChange,
  onFieldChange,
  onFileChange,
  onSampleFileChange,
  onClearError,
  mainsCategoryOptions,
  mainsCategoryLoading = false,
  categoryReadOnly = false,
}) {
  const category = form.category || ''
  /** Always show at least the category dropdown before a type is chosen */
  const layout = CURRENT_AFFAIRS_FIELD_LAYOUT[category] || [['category']]
  const years = getCurrentAffairsYearOptions()

  const renderField = (key) => {
    const label = getFieldLabel(key, category)
    const error = errors[key]

    if (key === 'category') {
      return (
        <CourseFormField key={key} label={label} required>
          <CourseSelect
            value={form.category}
            onChange={onCategoryChange}
            disabled={categoryReadOnly}
          >
            <option value="">Choose category</option>
            {CURRENT_AFFAIRS_FORM_CATEGORIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </CourseSelect>
          <FieldError message={error} />
        </CourseFormField>
      )
    }

    if (key === 'pdfUpload' || key === 'magazineUpload') {
      return (
        <CurrentAffairsFileField
          key={key}
          label={label}
          required
          value={form.fileName}
          error={error}
          inputKey={fileInputKey}
          onClearError={() => onClearError(key)}
          onChange={({ fileName, file, errorMessage }) => {
            if (errorMessage) {
              onFileChange({ fileName: '', file: null, errorMessage })
              return
            }
            onFileChange({ fileName, file })
          }}
        />
      )
    }

    if (key === 'sampleUpload') {
      return (
        <CurrentAffairsSampleFileField
          key={key}
          label={label}
          required
          value={form.sampleFileName}
          error={error}
          inputKey={sampleFileInputKey}
          onClearError={() => onClearError(key)}
          onChange={({ fileName, file, errorMessage }) => {
            if (errorMessage) {
              onSampleFileChange({ fileName: '', file: null, errorMessage })
              return
            }
            onSampleFileChange({ fileName, file })
          }}
        />
      )
    }

    if (key === 'year') {
      return (
        <CourseFormField key={key} label={label} required>
          <CourseSelect value={form.year} onChange={onFieldChange('year')}>
            <option value="">Select year</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </CourseSelect>
          <FieldError message={error} />
        </CourseFormField>
      )
    }

    if (key === 'month') {
      return (
        <CourseFormField key={key} label={label} required>
          <CourseSelect value={form.month} onChange={onFieldChange('month')}>
            <option value="">Select month</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </CourseSelect>
          <FieldError message={error} />
        </CourseFormField>
      )
    }

    if (key === 'date') {
      const dayOptions = getDaySelectOptions(form.month, form.year)
      const dayDisabled = !form.month || !form.year

      return (
        <CourseFormField key={key} label={label} required>
          <CourseSelect
            value={form.date}
            onChange={onFieldChange('date')}
            disabled={dayDisabled}
          >
            <option value="">
              {dayDisabled ? 'Select year and month first' : 'Select day'}
            </option>
            {dayOptions.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </CourseSelect>
          <FieldError message={error} />
        </CourseFormField>
      )
    }

    if (key === 'mainsCategory') {
      const options = mainsCategoryOptions?.length
        ? mainsCategoryOptions
        : MAINS_CATEGORY_OPTIONS.map((opt) => ({ value: opt, label: opt }))

      return (
        <CourseFormField key={key} label={label} required>
          <CourseSelect
            value={form.mainsCategory}
            onChange={onFieldChange('mainsCategory')}
            disabled={mainsCategoryLoading}
          >
            <option value="">{mainsCategoryLoading ? 'Loading…' : 'Select category'}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </CourseSelect>
          <FieldError message={error} />
        </CourseFormField>
      )
    }

    if (key === 'duration' || key === 'totalMarks') {
      const placeholder =
        key === 'duration' ? 'Enter duration (in minutes)' : 'Enter total marks'

      return (
        <CourseFormField key={key} label={label} required>
          <CourseInput
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={form[key] || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/[^\d]/g, '')
              onFieldChange(key)({ target: { value } })
            }}
            placeholder={placeholder}
          />
          <FieldError message={error} />
        </CourseFormField>
      )
    }

    const valueKey =
      key === 'paperName' ? 'paperName' : key === 'name' ? 'name' : key

    return (
      <CourseFormField key={key} label={label} required>
        <CourseInput
          value={form[valueKey] || ''}
          onChange={onFieldChange(valueKey)}
          placeholder={`Enter ${label.toLowerCase()}`}
        />
        <FieldError message={error} />
      </CourseFormField>
    )
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={category || 'empty'}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-4"
      >
        {layout.map((row, rowIndex) => (
          <div
            key={`${category || 'pick'}-row-${rowIndex}`}
            className={`grid gap-4 ${gridColsClass(row.length)}`}
          >
            {row.map((fieldKey) => renderField(fieldKey))}
          </div>
        ))}

        {!category ? (
          <p className="text-center text-sm text-gray-500">
            Select a category to load the rest of the form fields.
          </p>
        ) : null}
      </motion.div>
    </AnimatePresence>
  )
}
