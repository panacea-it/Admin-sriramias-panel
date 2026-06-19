import { useEffect, useRef, useState } from 'react'
import { useFieldArray, useForm, Controller } from 'react-hook-form'
import { ChevronDown, ChevronUp, ImageIcon, Sparkles, Upload, X } from 'lucide-react'
import { CourseAddMoreLink, CourseFormField, CourseInput, CourseTextarea } from './CourseFormField'
import { emptyWhyChooseFeature, normalizeWhyChooseFeatures } from '../../utils/whyChooseFeatures'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { validateUploadFile } from '../../utils/uploadValidation'
import { cn } from '../../utils/cn'

const ICON_ACCEPT = 'image/jpeg,image/png,image/webp,image/svg+xml'

function HighlightSwitch({ checked, onChange, id }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-[#55ace7]' : 'bg-gray-300',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

function FeatureIconUpload({ value, fileName, onFile }) {
  const inputRef = useRef(null)
  const [uploadError, setUploadError] = useState(null)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div
        className={cn(
          'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-[#fafcff]',
          value && 'border-[#55ace7]/40 bg-white',
        )}
      >
        {value ? (
          <img src={value} alt="" className="h-full w-full object-contain p-1.5" />
        ) : (
          <ImageIcon className="h-8 w-8 text-[#93c5fd]" strokeWidth={1.8} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-[#246392] shadow-sm transition hover:border-[#55ace7] hover:bg-[#f8fbff]"
        >
          <Upload className="h-4 w-4" />
          Upload icon
        </button>
        {fileName ? (
          <p className="mt-2 truncate text-xs font-medium text-gray-500">{fileName}</p>
        ) : null}
        <UploadFieldHint profile="IMAGE_ICON" className="mt-2" />
        <UploadValidationMessage message={uploadError} />
        <input
          ref={inputRef}
          type="file"
          accept={ICON_ACCEPT}
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const result = await validateUploadFile(file, 'IMAGE_ICON', { checkDimensions: false })
            if (!result.valid) {
              setUploadError(result.message)
              e.target.value = ''
              return
            }
            setUploadError(null)
            const reader = new FileReader()
            reader.onload = () => onFile(file, String(reader.result || ''))
            reader.readAsDataURL(file)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}

function FeatureCardEditor({
  index,
  total,
  register,
  control,
  errors,
  onRemove,
  onMoveUp,
  onMoveDown,
  setValue,
}) {
  const err = errors?.whyChooseFeatures?.[index]

  return (
    <article
      className={cn(
        'rounded-2xl border bg-white p-5 shadow-sm transition sm:p-6',
        err ? 'border-red-200' : 'border-gray-200/90',
      )}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef6fc] text-sm font-bold text-[#246392]">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-gray-700">Feature card</span>
          <Controller
            control={control}
            name={`whyChooseFeatures.${index}.isHighlighted`}
            render={({ field }) =>
              field.value ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                  <Sparkles className="h-3 w-3" />
                  Highlighted
                </span>
              ) : null
            }
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
            aria-label="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index >= total - 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
            aria-label="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          {total > 1 && (
            <button
              type="button"
              onClick={onRemove}
              className="ml-1 flex h-9 items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CourseFormField label="Feature Icon" className="lg:col-span-2">
          <Controller
            control={control}
            name={`whyChooseFeatures.${index}.iconPreview`}
            render={({ field: previewField }) => (
              <Controller
                control={control}
                name={`whyChooseFeatures.${index}.iconFileName`}
                render={({ field: nameField }) => (
                  <FeatureIconUpload
                    value={previewField.value}
                    fileName={nameField.value}
                    onFile={(file, dataUrl) => {
                      previewField.onChange(dataUrl)
                      setValue(`whyChooseFeatures.${index}.icon`, dataUrl)
                      setValue(`whyChooseFeatures.${index}.iconFile`, file)
                      nameField.onChange(file.name)
                    }}
                  />
                )}
              />
            )}
          />
        </CourseFormField>

        <CourseFormField label="Feature Title">
          <CourseInput
            {...register(`whyChooseFeatures.${index}.title`)}
            placeholder="e.g. Expert Faculty Guidance"
          />
        </CourseFormField>

        <CourseFormField label="Display Order">
          <CourseInput
            type="number"
            min={1}
            {...register(`whyChooseFeatures.${index}.order`, { valueAsNumber: true })}
            placeholder="1"
          />
        </CourseFormField>

        <CourseFormField label="Feature Description" className="lg:col-span-2">
          <CourseTextarea
            {...register(`whyChooseFeatures.${index}.description`)}
            rows={4}
            placeholder="e.g. Learn from experienced mentors with deep subject knowledge and proven UPSC teaching expertise."
            className="min-h-[7rem]"
          />
        </CourseFormField>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-100 bg-[#fafcff] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-700">Highlight card on website</p>
              <p className="mt-0.5 text-xs text-gray-500">
                When enabled, this card uses the highlighted style on the student site.
              </p>
            </div>
            <Controller
              control={control}
              name={`whyChooseFeatures.${index}.isHighlighted`}
              render={({ field }) => (
                <HighlightSwitch
                  id={`highlight-${index}`}
                  checked={Boolean(field.value)}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

export default function WhyChooseFeaturesSection({ features, onChange }) {
  const normalized = normalizeWhyChooseFeatures({ whyChooseFeatures: features })
  const syncingRef = useRef(false)

  const {
    control,
    register,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { whyChooseFeatures: normalized },
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'whyChooseFeatures',
  })

  useEffect(() => {
    syncingRef.current = true
    reset({ whyChooseFeatures: normalizeWhyChooseFeatures({ whyChooseFeatures: features }) })
    const t = setTimeout(() => {
      syncingRef.current = false
    }, 0)
    return () => clearTimeout(t)
  }, [features, reset])

  useEffect(() => {
    const sub = watch((data) => {
      if (syncingRef.current) return
      onChange(data.whyChooseFeatures || [])
    })
    return () => sub.unsubscribe()
  }, [watch, onChange])

  const handleAdd = () => {
    const nextOrder = fields.length + 1
    append(emptyWhyChooseFeature(nextOrder))
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Manage feature cards shown in the student website &quot;Why Choose the Course&quot; section.
        Each card maps to icon, heading, description, highlight style, and display order.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {fields.map((field, index) => (
          <FeatureCardEditor
            key={field.id}
            index={index}
            total={fields.length}
            register={register}
            control={control}
            errors={errors}
            setValue={setValue}
            onRemove={() => remove(index)}
            onMoveUp={() => index > 0 && move(index, index - 1)}
            onMoveDown={() => index < fields.length - 1 && move(index, index + 1)}
          />
        ))}
      </div>

      <div className="flex justify-end border-t border-gray-100 pt-5">
        <CourseAddMoreLink onClick={handleAdd} variant="pill">
          Add feature card
        </CourseAddMoreLink>
      </div>
    </div>
  )
}
