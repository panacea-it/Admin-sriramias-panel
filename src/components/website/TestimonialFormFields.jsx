import { ImageIcon } from 'lucide-react'
import { cn } from '../../utils/cn'
import { WebsiteField, websiteInputClass } from './websiteUi'
import {
  DEFAULT_EXAM_NAME,
  TESTIMONIAL_STATUS,
} from '../../constants/testimonialsConstants'
import { validateTestimonialImageFile } from '../../utils/testimonialApiHelpers'

const TESTIMONIAL_YEAR_MIN = 2000
const TESTIMONIAL_YEAR_MAX = 2100

const yearOptions = Array.from(
  { length: TESTIMONIAL_YEAR_MAX - TESTIMONIAL_YEAR_MIN + 1 },
  (_, index) => {
    const year = String(TESTIMONIAL_YEAR_MAX - index)
    return { value: year, label: year }
  },
)

const inputErrorClass = 'ring-2 ring-[#dc2626]/50'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-[#dc2626]">{message}</p>
}

export default function TestimonialFormFields({
  form,
  setForm,
  formErrors = {},
  clearFieldError,
  setFormErrors,
}) {
  const handleImagePick = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const imageError = validateTestimonialImageFile(file)
    if (imageError) {
      setFormErrors?.((current) => ({ ...current, testimonialImage: imageError }))
      event.target.value = ''
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setForm((current) => ({
      ...current,
      imagePreview: previewUrl,
      imageFileName: file.name,
      imageFile: file,
    }))
    clearFieldError?.('testimonialImage')
    event.target.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <WebsiteField label="Student Name" required>
          <input
            type="text"
            value={form.studentName}
            onChange={(e) => {
              setForm((f) => ({ ...f, studentName: e.target.value }))
              clearFieldError?.('studentName')
            }}
            aria-invalid={Boolean(formErrors.studentName)}
            className={cn(websiteInputClass, formErrors.studentName && inputErrorClass)}
            placeholder="e.g. Ananya Reddy"
          />
          <FieldError message={formErrors.studentName} />
        </WebsiteField>

        <WebsiteField label="Rank" required>
          <input
            type="text"
            inputMode="numeric"
            value={form.rank}
            onChange={(e) => {
              setForm((f) => ({ ...f, rank: e.target.value }))
              clearFieldError?.('rank')
            }}
            aria-invalid={Boolean(formErrors.rank)}
            className={cn(websiteInputClass, formErrors.rank && inputErrorClass)}
            placeholder="e.g. 72"
          />
          <FieldError message={formErrors.rank} />
        </WebsiteField>

        <WebsiteField label="Exam Name" required>
          <input
            type="text"
            value={form.examName}
            onChange={(e) => {
              setForm((f) => ({ ...f, examName: e.target.value }))
              clearFieldError?.('examName')
            }}
            className={websiteInputClass}
            placeholder={DEFAULT_EXAM_NAME}
          />
        </WebsiteField>

        <WebsiteField label="Year" required>
          <select
            value={form.year}
            onChange={(e) => {
              setForm((f) => ({ ...f, year: e.target.value }))
              clearFieldError?.('year')
            }}
            aria-invalid={Boolean(formErrors.year)}
            className={cn(websiteInputClass, 'cursor-pointer', formErrors.year && inputErrorClass)}
          >
            <option value="">Select year</option>
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <FieldError message={formErrors.year} />
        </WebsiteField>

        <WebsiteField label="Display Order" required>
          <input
            type="number"
            min={1}
            value={form.displayOrder}
            onChange={(e) => {
              setForm((f) => ({ ...f, displayOrder: e.target.value }))
              clearFieldError?.('displayOrder')
            }}
            aria-invalid={Boolean(formErrors.displayOrder)}
            className={cn(websiteInputClass, formErrors.displayOrder && inputErrorClass)}
            placeholder="1"
          />
          <FieldError message={formErrors.displayOrder} />
        </WebsiteField>

        <WebsiteField label="Status" required>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className={cn(websiteInputClass, 'cursor-pointer')}
          >
            <option value={TESTIMONIAL_STATUS.ACTIVE}>Active</option>
            <option value={TESTIMONIAL_STATUS.INACTIVE}>Inactive</option>
          </select>
        </WebsiteField>
      </div>

      <WebsiteField
        label="Quote / Excerpt"
        required
        className="sm:col-span-2"
      >
        <textarea
          value={form.excerpt}
          onChange={(e) => {
            setForm((f) => ({ ...f, excerpt: e.target.value }))
            clearFieldError?.('excerpt')
          }}
          rows={4}
          aria-invalid={Boolean(formErrors.excerpt)}
          className={cn(
            'w-full rounded-lg border-0 bg-[#eef6fc] px-4 py-3 text-sm text-[#111] outline-none transition focus:ring-2 focus:ring-[#55ace7]/40',
            formErrors.excerpt && inputErrorClass,
          )}
          placeholder="Handwritten-style quote shown on the student panel card…"
          style={{ fontFamily: "'Caveat', 'Segoe Script', cursive", fontSize: '16px' }}
        />
        <FieldError message={formErrors.excerpt} />
        <p className="mt-1.5 text-xs text-[#686868]">
          Shown inside the quote box on the student panel. Title line is auto-built from name, rank, exam, and year.
        </p>
      </WebsiteField>

      <WebsiteField label="Testimonial Image" required>
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-[#fafcff] px-6 py-8 transition hover:border-[#55ace7]/60 hover:bg-[#eef6fc]/60',
            formErrors.testimonialImage ? 'border-[#dc2626]/60' : 'border-[#55ace7]/35',
          )}
        >
          {form.imagePreview ? (
            <img
              src={form.imagePreview}
              alt="Testimonial preview"
              className="mb-3 max-h-40 rounded-lg object-contain shadow-sm"
            />
          ) : (
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef6fc] text-[#55ace7]">
              <ImageIcon className="h-7 w-7" strokeWidth={1.8} />
            </span>
          )}
          <span className="text-sm font-semibold text-[#246392]">
            {form.imageFileName || 'Click to upload testimonial image'}
          </span>
          <span className="mt-1 text-xs text-[#686868]">JPEG, PNG or WebP · max 5 MB</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleImagePick}
          />
        </label>
        <FieldError message={formErrors.testimonialImage} />
      </WebsiteField>
    </div>
  )
}
