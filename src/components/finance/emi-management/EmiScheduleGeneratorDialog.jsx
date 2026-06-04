import { useCallback, useEffect, useState } from 'react'
import { Calculator, Download, Printer, RefreshCw } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { EMI_SCHEDULE_FREQUENCIES } from '../../../constants/emiManagement'
import { previewEmiSchedule, regenerateEmiSchedule } from '../../../api/financeAPI'
import { printEmiScheduleDocument } from '../../../utils/emiSchedule'
import { formatINR } from '../../../utils/financeFilters'
import { toast } from '../../../utils/toast'
import { cn } from '../../../utils/cn'

const STEPS = ['Fee & loan', 'Schedule options', 'Preview']

export default function EmiScheduleGeneratorDialog({
  open,
  onClose,
  plan,
  onSaved,
  canManage,
}) {
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [form, setForm] = useState({
    totalCourseFee: 0,
    downPayment: 0,
    loanAmount: 0,
    interestRateAnnual: 0,
    emiDuration: 6,
    startDate: new Date().toISOString().slice(0, 10),
    frequency: 'monthly',
    customMonthsStep: 1,
  })

  useEffect(() => {
    if (!open || !plan) return
    setStep(0)
    setPreview(null)
    setForm({
      totalCourseFee: plan.totalFees || 0,
      downPayment: plan.downPayment || 0,
      loanAmount: plan.loanAmount || plan.pendingAmount || 0,
      interestRateAnnual: plan.interestRate || 0,
      emiDuration: plan.emiDurationMonths || plan.installments?.length || 6,
      startDate: plan.emiStartDate || new Date().toISOString().slice(0, 10),
      frequency: 'monthly',
      customMonthsStep: 1,
    })
  }, [open, plan])

  const runPreview = useCallback(async () => {
    setLoading(true)
    try {
      const data = await previewEmiSchedule(form)
      setPreview(data)
      setStep(2)
    } catch {
      toast.error('Could not generate schedule')
    } finally {
      setLoading(false)
    }
  }, [form])

  const handleSave = async () => {
    if (!plan?.id || !preview) return
    setLoading(true)
    try {
      await regenerateEmiSchedule(plan.id, form)
      toast.success('EMI schedule saved')
      onSaved?.()
      onClose()
    } catch {
      toast.error('Save failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    printEmiScheduleDocument({
      financials: { studentName: plan?.studentName, courseName: plan?.courseName },
      emiConfig: form,
      installments: preview?.installments,
      paymentId: plan?.id,
    })
  }

  const handleDownload = () => handlePrint()

  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} size="xl">
      <ModalPanelHeader
        icon={Calculator}
        title="EMI Schedule Generator"
        subtitle={plan ? `${plan.studentName} · ${plan.courseName}` : 'Configure installment plan'}
        onClose={onClose}
      />
      <div className="flex gap-1 border-b border-slate-100 px-4 pb-3">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => i < step && setStep(i)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold',
              step === i ? 'bg-[#246392] text-white' : 'text-[#686868] hover:bg-slate-50',
            )}
          >
            {i + 1}. {label}
          </button>
        ))}
      </div>

      <div className="max-h-[min(60vh,520px)] overflow-y-auto p-4">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['totalCourseFee', 'Total course fee (₹)'],
              ['downPayment', 'Down payment (₹)'],
              ['loanAmount', 'Loan amount (₹)'],
              ['interestRateAnnual', 'Interest rate (% p.a.)'],
              ['emiDuration', 'EMI duration (months)'],
              ['startDate', 'EMI start date', 'date'],
            ].map(([key, label, type = 'number']) => (
              <label key={key} className="block text-sm">
                <span className="font-medium text-[#686868]">{label}</span>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      [key]: type === 'number' ? Number(e.target.value) : e.target.value,
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3"
                />
              </label>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-[#686868]">Choose installment frequency</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {EMI_SCHEDULE_FREQUENCIES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, frequency: f.id }))}
                  className={cn(
                    'rounded-lg border p-3 text-left text-sm font-semibold transition',
                    form.frequency === f.id
                      ? 'border-[#246392] bg-[#eef6fc] text-[#246392]'
                      : 'border-slate-200 hover:border-[#55ace7]',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {form.frequency === 'custom' && (
              <label className="block text-sm">
                <span className="font-medium text-[#686868]">Custom interval (months)</span>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={form.customMonthsStep}
                  onChange={(e) => setForm((f) => ({ ...f, customMonthsStep: Number(e.target.value) }))}
                  className="mt-1 h-10 w-full max-w-xs rounded-lg border border-slate-200 px-3"
                />
              </label>
            )}
          </div>
        )}

        {step === 2 && preview && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="sticky top-0 bg-[#246392] text-left text-[11px] font-bold uppercase text-white">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Due</th>
                  <th className="px-3 py-2 text-right">Principal</th>
                  <th className="px-3 py-2 text-right">Interest</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {preview.installments.map((row, idx) => (
                  <tr key={row.emiNo} className={cn('border-t border-slate-100', idx % 2 && 'bg-slate-50/80')}>
                    <td className="px-3 py-2 font-bold text-[#246392]">{row.emiNo}</td>
                    <td className="px-3 py-2">{row.dueDate}</td>
                    <td className="px-3 py-2 text-right">{formatINR(row.principalAmount)}</td>
                    <td className="px-3 py-2 text-right">{formatINR(row.interestAmount)}</td>
                    <td className="px-3 py-2 text-right font-semibold">{formatINR(row.emiAmount)}</td>
                    <td className="px-3 py-2 text-right text-[#686868]">{formatINR(row.remainingBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-4">
        <div className="flex gap-2">
          {step === 2 && (
            <>
              <button type="button" onClick={handlePrint} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#246392] hover:bg-slate-50">
                <Printer className="h-4 w-4" /> Print
              </button>
              <button type="button" onClick={handleDownload} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#246392] hover:bg-slate-50">
                <Download className="h-4 w-4" /> PDF
              </button>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#686868] hover:bg-slate-50">
              Back
            </button>
          )}
          {step < 2 && (
            <button
              type="button"
              disabled={loading}
              onClick={() => (step === 1 ? runPreview() : setStep((s) => s + 1))}
              className="rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4d73] disabled:opacity-60"
            >
              {step === 1 ? (loading ? 'Generating…' : 'Preview schedule') : 'Next'}
            </button>
          )}
          {step === 2 && canManage && (
            <>
              <button type="button" onClick={runPreview} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#246392]">
                <RefreshCw className="h-4 w-4" /> Regenerate
              </button>
              <button type="button" disabled={loading} onClick={handleSave} className="rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1a4d73] disabled:opacity-60">
                Save schedule
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
