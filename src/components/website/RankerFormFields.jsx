import { useEffect, useState } from 'react'
import { WebsiteField, WebsiteImageInput, websiteInputClass } from './websiteUi'
import { getRankYearOptions } from '../../constants/rankManagementConstants'
import { TOP10_INACTIVE_MESSAGE } from './rankManagementDisplay'
import { lookupStudentByStudentId } from '../../utils/rankStudentLookup'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'

const inputErrorClass = 'ring-2 ring-[#EF4444]/60 bg-red-50/40'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs font-medium text-[#EF4444]">{message}</p>
}

function FormSwitch({ id, checked, onChange, disabled = false, label }) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-[#eef6fc] px-4 py-3',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="text-sm font-medium text-[#333]">{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
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
    </label>
  )
}

export const emptyRankForm = () => ({
  course: '',
  year: String(new Date().getFullYear()),
  studentId: '',
  studentName: '',
  rank: '',
  image: '',
  status: 'Active',
  isTop10: false,
  displayOrder: '',
})

export default function RankerFormFields({
  form,
  setForm,
  formErrors = {},
  setFormErrors,
  clearFieldError,
  top10LimitReached = false,
  wasTop10 = false,
  requireRegisteredStudent = false,
}) {
  const isDisplayed = form.status === 'Active'
  const [studentLookupLoading, setStudentLookupLoading] = useState(false)

  const resolveStudentFromId = async (studentId) => {
    const trimmed = String(studentId || '').trim()
    if (!trimmed) return

    setStudentLookupLoading(true)
    try {
      const result = await lookupStudentByStudentId(trimmed)
      if (!result.ok) {
        setForm((current) => ({ ...current, studentName: '' }))
        setFormErrors?.((prev) => ({
          ...prev,
          studentId: result.message,
          studentName: '',
        }))
        return
      }

      setForm((current) => ({
        ...current,
        studentId: result.studentId,
        studentName: result.studentName,
      }))
      setFormErrors?.((prev) => {
        const next = { ...prev }
        delete next.studentId
        delete next.studentName
        return next
      })
    } finally {
      setStudentLookupLoading(false)
    }
  }

  useEffect(() => {
    if (!requireRegisteredStudent) return undefined

    const trimmed = String(form.studentId || '').trim()
    if (!trimmed || trimmed.length < 4) return undefined

    const timer = window.setTimeout(() => {
      resolveStudentFromId(trimmed)
    }, 500)

    return () => window.clearTimeout(timer)
  }, [form.studentId, requireRegisteredStudent])

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <WebsiteField label="Course / Program" required>
        <input
          type="text"
          value={form.course}
          onChange={(e) => {
            setForm((f) => ({ ...f, course: e.target.value }))
            clearFieldError?.('course')
          }}
          aria-invalid={Boolean(formErrors.course)}
          className={cn(websiteInputClass, formErrors.course && inputErrorClass)}
          placeholder="e.g. UPSC Foundation"
        />
        <FieldError message={formErrors.course} />
      </WebsiteField>

      <WebsiteField label="Year" required>
        <select
          value={form.year}
          onChange={(e) => {
            setForm((f) => ({ ...f, year: e.target.value }))
            clearFieldError?.('year')
          }}
          aria-invalid={Boolean(formErrors.year)}
          className={cn(
            websiteInputClass,
            'cursor-pointer',
            formErrors.year && inputErrorClass,
          )}
          required
        >
          <option value="">Select year</option>
          {getRankYearOptions().map((year) => (
            <option key={year} value={String(year)}>
              {year}
            </option>
          ))}
        </select>
        <FieldError message={formErrors.year} />
      </WebsiteField>

      <WebsiteField label="Student ID" required>
        <input
          type="text"
          value={form.studentId}
          onChange={(e) => {
            setForm((f) => ({
              ...f,
              studentId: e.target.value,
              ...(requireRegisteredStudent ? { studentName: '' } : {}),
            }))
            clearFieldError?.('studentId')
            if (requireRegisteredStudent) clearFieldError?.('studentName')
          }}
          onBlur={() => {
            if (requireRegisteredStudent) {
              resolveStudentFromId(form.studentId)
            }
          }}
          aria-invalid={Boolean(formErrors.studentId)}
          className={cn(websiteInputClass, formErrors.studentId && inputErrorClass)}
          placeholder="e.g. STU003"
        />
        {requireRegisteredStudent ? (
          <p className="mt-1.5 text-xs text-[#686868]">
            Must match an enrolled student in Users → List Users. Name fills automatically.
            {studentLookupLoading ? ' Checking…' : ''}
          </p>
        ) : null}
        <FieldError message={formErrors.studentId} />
      </WebsiteField>

      <WebsiteField label="Student Name" required>
        <input
          type="text"
          value={form.studentName}
          readOnly={requireRegisteredStudent}
          onChange={(e) => {
            if (requireRegisteredStudent) return
            setForm((f) => ({ ...f, studentName: e.target.value }))
            clearFieldError?.('studentName')
          }}
          aria-invalid={Boolean(formErrors.studentName)}
          className={cn(
            websiteInputClass,
            requireRegisteredStudent && 'cursor-not-allowed bg-[#f5f8fb]',
            formErrors.studentName && inputErrorClass,
          )}
          placeholder={requireRegisteredStudent ? 'Auto-filled from Student ID' : undefined}
        />
        <FieldError message={formErrors.studentName} />
      </WebsiteField>

      <WebsiteField label="Rank" required>
        <input
          type="text"
          value={form.rank}
          onChange={(e) => {
            setForm((f) => ({ ...f, rank: e.target.value }))
            clearFieldError?.('rank')
          }}
          aria-invalid={Boolean(formErrors.rank)}
          className={cn(websiteInputClass, formErrors.rank && inputErrorClass)}
          placeholder="e.g. AIR 2"
        />
        <FieldError message={formErrors.rank} />
      </WebsiteField>

      <div className="flex flex-col gap-4 sm:col-span-2 sm:grid sm:grid-cols-2">
        <div>
          <FormSwitch
            id="topper-is-displayed"
            label="Display on customer website"
            checked={isDisplayed}
            onChange={(checked) => {
              const status = checked ? 'Active' : 'Deactivated'
              setForm((f) => ({
                ...f,
                status,
                ...(checked ? {} : { displayOrder: '', isTop10: false }),
              }))
              clearFieldError?.('status')
              clearFieldError?.('isTop10')
            }}
          />
          <FieldError message={formErrors.status} />
        </div>

        <div>
          <FormSwitch
            id="topper-is-top10"
            label="Mark as Top 10"
            checked={Boolean(form.isTop10)}
            disabled={!isDisplayed}
            onChange={(checked) => {
              if (checked && !isDisplayed) {
                toast.error(TOP10_INACTIVE_MESSAGE)
                return
              }
              if (checked && !wasTop10 && top10LimitReached) {
                toast.error('Maximum 10 Top Rankers allowed.')
                return
              }
              setForm((f) => ({
                ...f,
                isTop10: checked,
                ...(checked ? {} : { displayOrder: '' }),
              }))
              clearFieldError?.('isTop10')
            }}
          />
          <FieldError message={formErrors.isTop10} />
        </div>
      </div>

      <WebsiteField label="Student Image" required className="sm:col-span-2">
        <WebsiteImageInput
          id="ranker-image"
          value={form.image}
          invalid={Boolean(formErrors.image)}
          onChange={(val) => {
            setForm((f) => ({ ...f, image: val }))
            clearFieldError?.('image')
          }}
        />
        <p className="mt-2 text-xs text-[#686868]">
          Leave unchanged to keep the current image, or upload a new one to replace it.
        </p>
        <FieldError message={formErrors.image} />
      </WebsiteField>
    </div>
  )
}
