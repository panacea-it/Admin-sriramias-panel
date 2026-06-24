import { useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import OfflineProofDropzone from '../OfflineProofDropzone'
import { formatINR } from '../../../utils/financeFilters'
import { cn } from '../../../utils/cn'

const fieldClass =
  'mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25'

function parseAmountInput(raw) {
  return String(raw ?? '').replace(/[^\d.]/g, '')
}

export default function DownPaymentDetailsSection({
  config,
  onChange,
  proofFiles,
  onProofFilesChange,
  fieldErrors = {},
  financials,
}) {
  const [amountFocused, setAmountFocused] = useState(false)
  const replaceInputRef = useRef(null)

  const set = (key, value) => onChange({ ...config, [key]: value })
  const pending = financials?.pendingAmount ?? 0
  const down = Number(config.downPayment) || 0
  const requiresDetails = down > 0
  const uploadedFile = proofFiles[0]

  const displayAmount = amountFocused
    ? config.downPayment
    : config.downPayment
      ? Number(config.downPayment).toLocaleString('en-IN')
      : ''

  return (
    <section className="space-y-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-[#246392]">Down Payment Details</h3>
        {down > 0 && (
          <span className="text-xs text-[#686868]">
            Remaining after down payment:{' '}
            <strong className="tabular-nums text-[#246392]">
              {formatINR(Math.max(0, pending - down))}
            </strong>
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#555]">
          Down Payment Amount (₹)
          {requiresDetails && <span className="text-[#df8284]"> *</span>}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[#686868]">
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={displayAmount}
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
              onChange={(e) => set('downPayment', parseAmountInput(e.target.value))}
              className={cn(fieldClass, 'pl-7 tabular-nums', fieldErrors.amount && 'border-[#df8284]')}
              placeholder="0"
            />
          </div>
          {fieldErrors.amount ? (
            <span className="mt-1 block text-xs text-[#df8284]">{fieldErrors.amount}</span>
          ) : (
            down > 0 && (
              <span className="mt-1 block text-xs text-[#686868]">{formatINR(down)}</span>
            )
          )}
        </label>

        <label className="block text-xs font-semibold text-[#555]">
          Received By (Employee ID)
          {requiresDetails && <span className="text-[#df8284]"> *</span>}
          <input
            type="text"
            value={config.receivedBy || ''}
            onChange={(e) => set('receivedBy', e.target.value)}
            className={cn(fieldClass, fieldErrors.receivedBy && 'border-[#df8284]')}
            placeholder="Enter Employee ID"
            autoComplete="off"
          />
          {fieldErrors.receivedBy && (
            <span className="mt-1 block text-xs text-[#df8284]">{fieldErrors.receivedBy}</span>
          )}
        </label>
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold text-[#555]">
            Proof Upload
            {requiresDetails && <span className="text-[#df8284]"> *</span>}
          </p>
          {uploadedFile && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f9e7] px-2 py-0.5 text-[10px] font-semibold text-[#2d8a2a]">
              <CheckCircle2 className="h-3 w-3" />
              Upload complete
            </span>
          )}
        </div>

        <OfflineProofDropzone
          label="Down payment proof"
          files={proofFiles}
          onChange={onProofFilesChange}
          multiple={false}
          replaceInputRef={replaceInputRef}
        />

        {uploadedFile && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="truncate text-xs font-medium text-[#222]">{uploadedFile.name}</span>
            <button
              type="button"
              onClick={() => replaceInputRef.current?.click()}
              className="inline-flex h-8 items-center rounded-lg border border-[#55ace7]/30 bg-[#eef6fc] px-3 text-xs font-semibold text-[#246392] hover:bg-[#e0f0fa]"
            >
              Replace file
            </button>
            <button
              type="button"
              onClick={() => onProofFilesChange?.([])}
              className="inline-flex h-8 items-center rounded-lg border border-[#df8284]/30 bg-white px-3 text-xs font-semibold text-[#df8284] hover:bg-red-50"
            >
              Remove file
            </button>
          </div>
        )}

        {fieldErrors.proof && (
          <span className="mt-1 block text-xs text-[#df8284]">{fieldErrors.proof}</span>
        )}
      </div>
    </section>
  )
}
