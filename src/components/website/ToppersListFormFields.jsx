import { FileText } from 'lucide-react'
import { cn } from '../../utils/cn'
import { WebsiteField, websiteInputClass } from './websiteUi'
import {
  TOPPERS_LIST_STATUS,
  TOPPER_YEAR_OPTIONS,
  buildToppersListTitle,
} from '../../constants/toppersListConstants'

const inputErrorClass = 'ring-2 ring-[#dc2626]/50'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs font-medium text-[#dc2626]">{message}</p>
}

export default function ToppersListFormFields({
  form,
  setForm,
  formErrors = {},
  clearFieldError,
  isEdit = false,
}) {
  const yearOptions = TOPPER_YEAR_OPTIONS.filter((opt) => opt.value !== 'all')

  const handleYearChange = (value) => {
    setForm((current) => ({
      ...current,
      year: value,
      title: current.title.trim() ? current.title : value ? buildToppersListTitle(value) : '',
    }))
    clearFieldError?.('year')
  }

  const handlePdfPick = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setForm((current) => ({
      ...current,
      pdfFileName: file.name,
      pdfFileSize: file.size,
      pdfFile: file,
    }))
    clearFieldError?.('pdfFile')
    event.target.value = ''
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <WebsiteField label="Year" required>
          <select
            value={form.year}
            onChange={(e) => handleYearChange(e.target.value)}
            disabled={isEdit}
            aria-invalid={Boolean(formErrors.year)}
            className={cn(
              websiteInputClass,
              'cursor-pointer disabled:cursor-not-allowed disabled:opacity-70',
              formErrors.year && inputErrorClass,
            )}
          >
            <option value="">Select year</option>
            {yearOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <FieldError message={formErrors.year} />
          {isEdit ? (
            <p className="mt-1.5 text-xs text-[#686868]">Year cannot be changed after creation.</p>
          ) : null}
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

        <WebsiteField label="Title" required className="sm:col-span-2">
          <input
            type="text"
            value={form.title}
            onChange={(e) => {
              setForm((f) => ({ ...f, title: e.target.value }))
              clearFieldError?.('title')
            }}
            aria-invalid={Boolean(formErrors.title)}
            className={cn(websiteInputClass, formErrors.title && inputErrorClass)}
            placeholder="e.g. 2030 Toppers' List"
          />
          <FieldError message={formErrors.title} />
          <p className="mt-1.5 text-xs text-[#686868]">
            Shown on the student panel PDF card for the selected year.
          </p>
        </WebsiteField>

        <WebsiteField label="Status" required>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className={cn(websiteInputClass, 'cursor-pointer')}
          >
            <option value={TOPPERS_LIST_STATUS.ACTIVE}>Active</option>
            <option value={TOPPERS_LIST_STATUS.INACTIVE}>Inactive</option>
          </select>
        </WebsiteField>
      </div>

      <WebsiteField label="Toppers List PDF" required>
        <label
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-[#fafcff] px-6 py-8 transition hover:border-[#55ace7]/60 hover:bg-[#eef6fc]/60',
            formErrors.pdfFile ? 'border-[#dc2626]/60' : 'border-[#55ace7]/35',
          )}
        >
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef6fc] text-[#55ace7]">
            <FileText className="h-7 w-7" strokeWidth={1.8} />
          </span>
          <span className="text-sm font-semibold text-[#246392]">
            {form.pdfFileName || 'Click to upload PDF file'}
          </span>
          <span className="mt-1 text-xs text-[#686868]">PDF only · max 25 MB</span>
          {form.pdfFileSize ? (
            <span className="mt-1 text-xs text-[#686868]">
              {(form.pdfFileSize / (1024 * 1024)).toFixed(2)} MB
            </span>
          ) : null}
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={handlePdfPick}
          />
        </label>
        <FieldError message={formErrors.pdfFile} />
      </WebsiteField>
    </div>
  )
}
