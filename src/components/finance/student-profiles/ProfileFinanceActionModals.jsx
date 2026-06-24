import { useEffect, useState } from 'react'
import { Percent, Receipt, RotateCcw } from 'lucide-react'
import FinanceSettingsPanelShell from '../FinanceSettingsPanelShell'
import FormModalSubmitBar from '../../common/FormModalSubmitBar'
import OfflineProofDropzone from '../OfflineProofDropzone'
import { FINANCE_PAYMENT_MODES } from '../../../constants/financeConstants'
import { formatINR } from '../../../utils/financeFilters'
import { cn } from '../../../utils/cn'

const FIELD_CLASS =
  'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

const READONLY_CLASS = cn(FIELD_CLASS, 'cursor-not-allowed bg-slate-50 text-[#686868]')

function ReadonlyStudentField({ studentName }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-[#222]">Student name</span>
      <input type="text" value={studentName || ''} readOnly className={READONLY_CLASS} />
    </label>
  )
}

function AmountField({ label = 'Amount', value, onChange, error, hint }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold text-[#222]">{label}</span>
      <input
        type="number"
        min="1"
        step="1"
        value={value}
        onChange={onChange}
        placeholder="Enter amount"
        className={cn(FIELD_CLASS, error && 'border-[#df8284]')}
      />
      {hint && <span className="mt-1 block text-xs text-[#686868]">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-[#df8284]">{error}</span>}
    </label>
  )
}

function ActionFormShell({ open, onClose, title, subtitle, icon: Icon, children, onSubmit, saving, submitLabel }) {
  return (
    <FinanceSettingsPanelShell
      open={open}
      onClose={onClose}
      zIndex={120}
      size="md"
      className="sm:max-w-lg"
      title={title}
      subtitle={subtitle}
      icon={Icon}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit?.()
        }}
        className="space-y-4 p-5 sm:p-6"
      >
        {children}
        <FormModalSubmitBar
          isEditMode={false}
          createLabel={submitLabel}
          loadingLabel="Saving…"
          isSubmitting={saving}
          onReset={onClose}
          resetLabel="Cancel"
        />
      </form>
    </FinanceSettingsPanelShell>
  )
}

export function ProfileAddPaymentModal({ open, profile, onClose, onSubmit, saving }) {
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState(FINANCE_PAYMENT_MODES[0])
  const [proofFiles, setProofFiles] = useState([])
  const [errors, setErrors] = useState({})

  const pending = profile?.totalPending ?? 0

  useEffect(() => {
    if (!open) return
    setAmount(pending > 0 ? String(pending) : '')
    setPaymentMethod(FINANCE_PAYMENT_MODES[0])
    setProofFiles([])
    setErrors({})
  }, [open, pending])

  const handleSubmit = () => {
    const next = {}
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) next.amount = 'Enter a valid amount'
    if (!proofFiles.length) next.proof = 'Payment proof is required'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }
    setErrors({})
    onSubmit?.({
      amount: parsed,
      paymentMethod,
      proofFileName: proofFiles[0]?.name || 'proof',
    })
  }

  return (
    <ActionFormShell
      open={open}
      onClose={onClose}
      title="Add payment"
      subtitle="Record an offline or manual payment for this student"
      icon={Receipt}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel="Add payment"
    >
      <ReadonlyStudentField studentName={profile?.studentName} />
      <div className="space-y-2">
        {pending > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setAmount(String(pending))
                setErrors((prev) => ({ ...prev, amount: undefined }))
              }}
              className="rounded-lg border border-[#55ace7]/30 bg-[#eef6fc] px-3 py-1.5 text-xs font-semibold text-[#246392]"
            >
              Full pending — {formatINR(pending)}
            </button>
            {pending >= 2 && (
              <button
                type="button"
                onClick={() => {
                  setAmount(String(Math.round(pending / 2)))
                  setErrors((prev) => ({ ...prev, amount: undefined }))
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#444]"
              >
                Half — {formatINR(Math.round(pending / 2))}
              </button>
            )}
          </div>
        )}
        <AmountField
          label="Choose amount"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value)
            setErrors((prev) => ({ ...prev, amount: undefined }))
          }}
          error={errors.amount}
          hint={pending > 0 ? `Pending balance: ${formatINR(pending)}` : undefined}
        />
      </div>
      {errors.proof && <span className="block text-xs text-[#df8284]">{errors.proof}</span>}
      <label className="block text-sm">
        <span className="font-semibold text-[#222]">Payment method</span>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={FIELD_CLASS}>
          {FINANCE_PAYMENT_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </label>
      <div>
        <p className="mb-1 text-sm font-semibold text-[#222]">Proof</p>
        <OfflineProofDropzone files={proofFiles} onChange={setProofFiles} multiple={false} label="Upload payment proof" />
      </div>
    </ActionFormShell>
  )
}

export function ProfileApplyScholarshipModal({ open, profile, onClose, onSubmit, saving }) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount('')
    setError('')
  }, [open])

  const handleSubmit = () => {
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) {
      setError('Enter a valid scholarship amount')
      return
    }
    setError('')
    onSubmit?.({ amount: parsed })
  }

  return (
    <ActionFormShell
      open={open}
      onClose={onClose}
      title="Apply scholarship"
      subtitle="Grant a scholarship adjustment to the student fee"
      icon={Percent}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel="Apply scholarship"
    >
      <ReadonlyStudentField studentName={profile?.studentName} />
      <AmountField
        label="Choose amount"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value)
          setError('')
        }}
        error={error}
        hint={profile?.totalFees ? `Total fees: ${formatINR(profile.totalFees)}` : undefined}
      />
    </ActionFormShell>
  )
}

export function ProfileAddDiscountModal({ open, profile, onClose, onSubmit, saving }) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setAmount('')
    setError('')
  }, [open])

  const handleSubmit = () => {
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) {
      setError('Enter a valid discount amount')
      return
    }
    setError('')
    onSubmit?.({ amount: parsed })
  }

  return (
    <ActionFormShell
      open={open}
      onClose={onClose}
      title="Add discount"
      subtitle="Apply a one-time discount to the student account"
      icon={Percent}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel="Add discount"
    >
      <ReadonlyStudentField studentName={profile?.studentName} />
      <AmountField
        label="Amount"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value)
          setError('')
        }}
        error={error}
      />
    </ActionFormShell>
  )
}

export function ProfileProcessRefundModal({ open, profile, onClose, onSubmit, saving }) {
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!open) return
    setAmount('')
    setReason('')
    setErrors({})
  }, [open])

  const handleSubmit = () => {
    const next = {}
    const parsed = Number(amount)
    if (!parsed || parsed <= 0) next.amount = 'Enter a valid refund amount'
    if (!reason.trim()) next.reason = 'Refund reason is required'
    if (Object.keys(next).length) {
      setErrors(next)
      return
    }
    setErrors({})
    onSubmit?.({ amount: parsed, reason: reason.trim() })
  }

  return (
    <ActionFormShell
      open={open}
      onClose={onClose}
      title="Process refund"
      subtitle="Initiate a refund against collected payments"
      icon={RotateCcw}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel="Process refund"
    >
      <ReadonlyStudentField studentName={profile?.studentName} />
      <AmountField
        label="Amount"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value)
          setErrors((prev) => ({ ...prev, amount: undefined }))
        }}
        error={errors.amount}
        hint={profile?.totalPaid ? `Total paid: ${formatINR(profile.totalPaid)}` : undefined}
      />
      <label className="block text-sm">
        <span className="font-semibold text-[#222]">Reason</span>
        <textarea
          value={reason}
          onChange={(e) => {
            setReason(e.target.value)
            setErrors((prev) => ({ ...prev, reason: undefined }))
          }}
          rows={3}
          placeholder="Describe why this refund is being processed"
          className={cn(FIELD_CLASS, 'min-h-[88px] resize-y py-2', errors.reason && 'border-[#df8284]')}
        />
        {errors.reason && <span className="mt-1 block text-xs text-[#df8284]">{errors.reason}</span>}
      </label>
    </ActionFormShell>
  )
}
