import {
  CourseFormField,
  CourseInput,
  CourseSelect,
} from './CourseFormField'
import PaymentBulletsField from './batch-form/PaymentBulletsField'
import { batchFormGrid } from './batch-form/BatchFormCard'
import {
  bulletsToText,
  COURSE_CURRENCIES,
  parsePaymentBullets,
} from '../../utils/feeDetailsForm'
import { cn } from '../../utils/cn'

const ONLINE_SAMPLES = Array.from({ length: 8 }, (_, i) => `Online payment bullet point ${i + 1}`)
const OFFLINE_SAMPLES = Array.from({ length: 8 }, (_, i) => `Offline payment bullet point ${i + 1}`)

/** Fee Details — Add/Edit Batch (content only; wrapped by BatchFormCard in modal) */
export default function BatchFeeDetailsSection({ form, setForm }) {
  const fee = form.feeDetails || {}

  const updateFee = (key, value) => {
    setForm((f) => ({
      ...f,
      feeDetails: { ...f.feeDetails, [key]: value },
    }))
  }

  const onlineText =
    fee.onlinePaymentBulletsText ?? bulletsToText(fee.onlinePaymentBullets)
  const offlineText =
    fee.offlinePaymentBulletsText ?? bulletsToText(fee.offlinePaymentBullets)

  return (
    <div className="space-y-8">
      <div className={cn(batchFormGrid, 'gap-5')}>
        <CourseFormField label="Currency">
          <CourseSelect
            value={fee.currency || 'INR'}
            onChange={(e) => updateFee('currency', e.target.value)}
          >
            {COURSE_CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </CourseSelect>
        </CourseFormField>

        <CourseFormField label="Discount Fee">
          <CourseInput
            type="number"
            min={0}
            value={fee.discountFee ?? ''}
            onChange={(e) => updateFee('discountFee', e.target.value)}
            placeholder="Optional discounted amount"
          />
        </CourseFormField>

        <CourseFormField label="Online Payment Amount">
          <CourseInput
            type="number"
            min={0}
            value={fee.onlinePaymentAmount ?? ''}
            onChange={(e) => updateFee('onlinePaymentAmount', e.target.value)}
            placeholder="Enter online payment amount"
          />
        </CourseFormField>

        <CourseFormField label="Offline Payment Amount">
          <CourseInput
            type="number"
            min={0}
            value={fee.offlinePaymentAmount ?? ''}
            onChange={(e) => updateFee('offlinePaymentAmount', e.target.value)}
            placeholder="Enter offline payment amount"
          />
        </CourseFormField>
      </div>

      <div className="space-y-8 border-t border-[#eef2fc] pt-8">
        <PaymentBulletsField
          label="Online Payment – Bullet Points"
          placeholder="Add bullet points for online payment"
          helperText="Add at least 5 to 8 bullet points — one per line."
          sampleItems={ONLINE_SAMPLES}
          value={onlineText}
          onChange={(text) => {
            setForm((f) => ({
              ...f,
              feeDetails: {
                ...f.feeDetails,
                onlinePaymentBulletsText: text,
                onlinePaymentBullets: parsePaymentBullets(text),
              },
            }))
          }}
        />

        <PaymentBulletsField
          label="Offline Payment – Bullet Points"
          placeholder="Add bullet points for offline payment"
          helperText="Add at least 5 to 8 bullet points — one per line."
          sampleItems={OFFLINE_SAMPLES}
          value={offlineText}
          onChange={(text) => {
            setForm((f) => ({
              ...f,
              feeDetails: {
                ...f.feeDetails,
                offlinePaymentBulletsText: text,
                offlinePaymentBullets: parsePaymentBullets(text),
              },
            }))
          }}
        />
      </div>
    </div>
  )
}
