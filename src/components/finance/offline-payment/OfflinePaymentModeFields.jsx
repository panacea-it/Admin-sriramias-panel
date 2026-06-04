import OfflineProofDropzone from '../OfflineProofDropzone'
import { cn } from '../../../utils/cn'

const fieldClass =
  'mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]/40'

export default function OfflinePaymentModeFields({
  paymentMode,
  register,
  modeFields,
  setModeFields,
  proofFile,
  proofFiles = [],
  proofPreview,
  onProofChange,
  onProofFilesChange,
  onClearProof,
}) {
  const setMode = (key, value) => setModeFields((f) => ({ ...f, [key]: value }))

  return (
    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#246392]">Payment mode details</p>

      {paymentMode === 'UPI' && (
        <>
          <label className="block text-sm font-semibold text-[#333]">
            UTR number
            <input
              {...register('utrNumber', { required: !paymentMode })}
              className={cn(fieldClass, 'font-mono')}
              placeholder="12-digit UTR"
            />
          </label>
          <ProofUploadBlock
            proofFiles={proofFiles}
            onProofFilesChange={onProofFilesChange}
            onProofChange={onProofChange}
            onClearProof={onClearProof}
            label="UPI screenshot"
          />
        </>
      )}

      {paymentMode === 'Bank Transfer' && (
        <>
          <label className="block text-sm font-semibold text-[#333]">
            Reference / NEFT number
            <input {...register('utrNumber')} className={cn(fieldClass, 'font-mono')} />
          </label>
          <ProofUploadBlock
            proofFiles={proofFiles}
            onProofFilesChange={onProofFilesChange}
            onProofChange={onProofChange}
            onClearProof={onClearProof}
            label="Transfer receipt"
          />
        </>
      )}

      {paymentMode === 'Cheque' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-[#333]">
            Cheque number
            <input
              value={modeFields.chequeNumber || ''}
              onChange={(e) => setMode('chequeNumber', e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold text-[#333]">
            Bank name
            <input
              value={modeFields.bankName || ''}
              onChange={(e) => setMode('bankName', e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-semibold text-[#333] sm:col-span-2">
            Cheque date
            <input
              type="date"
              value={modeFields.chequeDate || ''}
              onChange={(e) => setMode('chequeDate', e.target.value)}
              className={fieldClass}
            />
          </label>
        </div>
      )}

      {paymentMode === 'DD' && (
        <label className="block text-sm font-semibold text-[#333]">
          DD number
          <input
            value={modeFields.ddNumber || ''}
            onChange={(e) => setMode('ddNumber', e.target.value)}
            className={fieldClass}
          />
        </label>
      )}

      {paymentMode === 'Cash' && (
        <label className="block text-sm font-semibold text-[#333]">
          Receipt number
          <input
            value={modeFields.receiptNumber || ''}
            onChange={(e) => setMode('receiptNumber', e.target.value)}
            className={fieldClass}
            placeholder="Counter receipt #"
          />
        </label>
      )}

      {paymentMode === 'POS Machine' && (
        <label className="block text-sm font-semibold text-[#333]">
          POS transaction ID
          <input
            {...register('utrNumber')}
            className={cn(fieldClass, 'font-mono')}
          />
        </label>
      )}

      {paymentMode === 'Card' && (
        <label className="block text-sm font-semibold text-[#333]">
          Authorization reference
          <input {...register('utrNumber')} className={cn(fieldClass, 'font-mono')} />
        </label>
      )}

      {!['UPI', 'Bank Transfer'].includes(paymentMode) && (
        <ProofUploadBlock
          proofFiles={proofFiles}
          onProofFilesChange={onProofFilesChange}
          onProofChange={onProofChange}
          onClearProof={onClearProof}
          label="Upload proof"
        />
      )}
    </div>
  )
}

function ProofUploadBlock({ proofFiles, onProofFilesChange, onProofChange, onClearProof, label }) {
  if (onProofFilesChange) {
    return (
      <OfflineProofDropzone
        label={label}
        files={proofFiles}
        onChange={(items) => {
          onProofFilesChange(items)
          if (!items.length) onClearProof?.()
        }}
      />
    )
  }

  return (
    <OfflineProofDropzone
      label={label}
      files={proofFiles}
      onChange={(items) => {
        onProofFilesChange?.(items)
        if (!items.length) onClearProof?.()
        else if (items[0]?.file) {
          onProofChange?.({ target: { files: [items[0].file] } })
        }
      }}
    />
  )
}
