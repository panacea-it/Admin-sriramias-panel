import { useCallback, useEffect, useRef, useState } from 'react'
import { Settings2, Save, FileText } from 'lucide-react'
import FinancePageShell from '../../components/finance/FinancePageShell'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import {
  fetchGstSettingsDetails,
  previewGstSettings,
  saveGstSettings,
} from '../../api/gstSettingsAPI'
import {
  mapDetailsToForm,
  mapFormToPayload,
  serializeFormPayload,
} from '../../utils/finance/gstSettingsMapper'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import { isValidGstin, gstinValidationMessage } from '../../utils/finance/gstValidation'
import { formatINR } from '../../utils/financeFilters'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const PREVIEW_DEBOUNCE_MS = 400

export default function GstInvoiceSettingsPage() {
  const { canManageGst } = useFinancePermissions()
  const [form, setForm] = useState(() => mapDetailsToForm(null))
  const [preview, setPreview] = useState(null)
  const [savedSnapshot, setSavedSnapshot] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [gstinErrors, setGstinErrors] = useState({})
  const dirtyRef = useRef(false)
  const previewTimerRef = useRef(null)
  const skipPreviewRef = useRef(true)

  const isDirty = savedSnapshot ? serializeFormPayload(form) !== savedSnapshot : false

  const applyDetails = useCallback((details) => {
    const nextForm = mapDetailsToForm(details)
    setForm(nextForm)
    setPreview(details.preview || null)
    setSavedSnapshot(serializeFormPayload(nextForm))
    dirtyRef.current = false
    skipPreviewRef.current = true
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchGstSettingsDetails()
      applyDetails(data)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load GST settings'))
    } finally {
      setLoading(false)
    }
  }, [applyDetails])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    if (loading || skipPreviewRef.current) {
      skipPreviewRef.current = false
      return undefined
    }
    if (!isDirty) return undefined

    if (previewTimerRef.current) {
      window.clearTimeout(previewTimerRef.current)
    }

    previewTimerRef.current = window.setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const payload = mapFormToPayload(form)
        const nextPreview = await previewGstSettings(payload)
        setPreview(nextPreview)
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to update preview'))
      } finally {
        setPreviewLoading(false)
      }
    }, PREVIEW_DEBOUNCE_MS)

    return () => {
      if (previewTimerRef.current) {
        window.clearTimeout(previewTimerRef.current)
      }
    }
  }, [form, isDirty, loading])

  const markDirty = () => {
    dirtyRef.current = true
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!canManageGst) {
      toast.error('Not permitted to edit GST settings')
      return
    }

    const errors = {}
    ;(form.branchGst || []).forEach((branch, idx) => {
      if (branch.gstEnabled && branch.gstNumber?.trim()) {
        const msg = gstinValidationMessage(branch.gstNumber)
        if (msg) errors[idx] = msg
      }
    })
    setGstinErrors(errors)
    if (Object.keys(errors).length) {
      toast.error('Fix GSTIN validation errors before saving')
      return
    }

    setSaving(true)
    try {
      const saved = await saveGstSettings(mapFormToPayload(form))
      applyDetails(saved)
      toast.success('GST settings saved successfully')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to save settings'))
    } finally {
      setSaving(false)
    }
  }

  const updateBranch = (idx, field, value) => {
    markDirty()
    setForm((prev) => ({
      ...prev,
      branchGst: prev.branchGst.map((b, i) => (i === idx ? { ...b, [field]: value } : b)),
    }))
    if (field === 'gstNumber') {
      setGstinErrors((prev) => {
        const next = { ...prev }
        delete next[idx]
        return next
      })
    }
  }

  const previewData = preview || {
    companyName: form.companyName || 'Sriram IAS',
    financialYear: String(form.financialYear || new Date().getFullYear()),
    invoiceNumber: '—',
    receiptNumber: '—',
    gstRateLabel: form.taxEnabled ? `${form.gstPercent}%` : 'Disabled',
    showTaxRows: false,
    taxableAmount: 100000,
    cgstRate: 0,
    sgstRate: 0,
    cgst: 0,
    sgst: 0,
    total: 100000,
    branchFormatExamples: [],
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

  return (
    <FinancePageShell
      icon={Settings2}
      title="GST & Invoice Settings"
      breadcrumbs={[{ label: 'GST & Invoice Settings' }]}
      actions={
        canManageGst && (
          <button
            type="submit"
            form="gst-form"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#246392] px-4 text-sm font-semibold text-white hover:bg-[#1a3a5c] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        )
      }
    >
      {loading ? (
        <FinanceTableSkeleton rows={4} columns={2} />
      ) : (
        <form id="gst-form" onSubmit={handleSave} className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
              <h3 className="mb-4 text-sm font-bold text-[#246392]">Global tax settings</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  GST percent
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={!canManageGst}
                    value={form.gstPercent}
                    onChange={(e) => {
                      markDirty()
                      setForm((f) => ({ ...f, gstPercent: Number(e.target.value) }))
                    }}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Invoice prefix
                  <input
                    disabled={!canManageGst}
                    value={form.invoicePrefix}
                    onChange={(e) => {
                      markDirty()
                      setForm((f) => ({ ...f, invoicePrefix: e.target.value }))
                    }}
                    className={inputClass}
                    placeholder="INV"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Receipt prefix
                  <input
                    disabled={!canManageGst}
                    value={form.receiptPrefix}
                    onChange={(e) => {
                      markDirty()
                      setForm((f) => ({ ...f, receiptPrefix: e.target.value }))
                    }}
                    className={inputClass}
                    placeholder="RCP"
                  />
                </label>
                <label className="flex items-center gap-2 pt-6 text-sm font-medium">
                  <input
                    type="checkbox"
                    disabled={!canManageGst}
                    checked={form.taxEnabled}
                    onChange={(e) => {
                      markDirty()
                      setForm((f) => ({ ...f, taxEnabled: e.target.checked }))
                    }}
                    className="h-4 w-4 rounded"
                  />
                  Enable tax on invoices
                </label>
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
              <h3 className="mb-4 text-sm font-bold text-[#246392]">Branch GST numbers</h3>
              <div className="space-y-4">
                {(form.branchGst || []).map((branch, idx) => (
                  <div key={branch.branchId || idx} className="grid gap-3 rounded-lg border border-slate-100 p-4 sm:grid-cols-3">
                    <p className="font-semibold text-[#111] sm:col-span-3">
                      {branch.branchName}
                      {branch.branchCode && (
                        <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-[#444]">
                          {branch.branchCode}
                        </span>
                      )}
                    </p>
                    <label className="block text-sm font-medium">
                      Branch code
                      <input
                        disabled={!canManageGst}
                        value={branch.branchCode || ''}
                        onChange={(e) => updateBranch(idx, 'branchCode', e.target.value.toUpperCase())}
                        className={inputClass}
                        placeholder="DEL"
                        maxLength={5}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        disabled={!canManageGst}
                        checked={branch.gstEnabled}
                        onChange={(e) => updateBranch(idx, 'gstEnabled', e.target.checked)}
                        className="h-4 w-4 rounded"
                      />
                      GST enabled
                    </label>
                    <label className="block text-sm font-medium sm:col-span-2">
                      GSTIN
                      <input
                        disabled={!canManageGst}
                        value={branch.gstNumber}
                        onChange={(e) => updateBranch(idx, 'gstNumber', e.target.value.toUpperCase())}
                        className={cn(inputClass, gstinErrors[idx] && 'border-[#df8284]')}
                        placeholder="29ABCDE1234F1Z5"
                        maxLength={15}
                        aria-invalid={!!gstinErrors[idx]}
                      />
                      {gstinErrors[idx] && (
                        <p className="mt-1 text-xs text-[#df8284]">{gstinErrors[idx]}</p>
                      )}
                      {branch.gstNumber && isValidGstin(branch.gstNumber) && (
                        <p className="mt-1 text-xs text-[#69df66]">Valid GSTIN format</p>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
              <h3 className="mb-4 text-sm font-bold text-[#246392]">Receipt template & branding</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium sm:col-span-2">
                  Company name
                  <input
                    disabled={!canManageGst}
                    value={form.companyName || ''}
                    onChange={(e) => { markDirty(); setForm((f) => ({ ...f, companyName: e.target.value })) }}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm font-medium sm:col-span-2">
                  Company address
                  <textarea
                    disabled={!canManageGst}
                    value={form.companyAddress || ''}
                    onChange={(e) => { markDirty(); setForm((f) => ({ ...f, companyAddress: e.target.value })) }}
                    className={inputClass}
                    rows={2}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Financial year
                  <input
                    type="number"
                    disabled={!canManageGst}
                    value={form.financialYear || ''}
                    onChange={(e) => { markDirty(); setForm((f) => ({ ...f, financialYear: Number(e.target.value) })) }}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm font-medium">
                  Logo URL
                  <input
                    disabled={!canManageGst}
                    value={form.logoUrl || ''}
                    onChange={(e) => { markDirty(); setForm((f) => ({ ...f, logoUrl: e.target.value })) }}
                    className={inputClass}
                    placeholder="https://…"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Signature image URL
                  <input
                    disabled={!canManageGst}
                    value={form.signatureUrl || ''}
                    onChange={(e) => { markDirty(); setForm((f) => ({ ...f, signatureUrl: e.target.value })) }}
                    className={inputClass}
                    placeholder="https://…"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Signatory name
                  <input
                    disabled={!canManageGst}
                    value={form.signatoryName || ''}
                    onChange={(e) => { markDirty(); setForm((f) => ({ ...f, signatoryName: e.target.value })) }}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm font-medium sm:col-span-2">
                  Signatory designation
                  <input
                    disabled={!canManageGst}
                    value={form.signatoryDesignation || ''}
                    onChange={(e) => { markDirty(); setForm((f) => ({ ...f, signatoryDesignation: e.target.value })) }}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm font-medium sm:col-span-2">
                  Footer notes
                  <textarea
                    disabled={!canManageGst}
                    value={form.footerNotes || ''}
                    onChange={(e) => { markDirty(); setForm((f) => ({ ...f, footerNotes: e.target.value })) }}
                    className={inputClass}
                    rows={2}
                  />
                </label>
                <label className="block text-sm font-medium sm:col-span-2">
                  Terms & conditions
                  <textarea
                    disabled={!canManageGst}
                    value={form.termsAndConditions || ''}
                    onChange={(e) => { markDirty(); setForm((f) => ({ ...f, termsAndConditions: e.target.value })) }}
                    className={inputClass}
                    rows={3}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    disabled={!canManageGst}
                    checked={form.watermarkEnabled !== false}
                    onChange={(e) => { markDirty(); setForm((f) => ({ ...f, watermarkEnabled: e.target.checked })) }}
                    className="h-4 w-4 rounded"
                  />
                  PDF watermark
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    disabled={!canManageGst}
                    checked={Boolean(form.autoSendReceipt)}
                    onChange={(e) => { markDirty(); setForm((f) => ({ ...f, autoSendReceipt: e.target.checked })) }}
                    className="h-4 w-4 rounded"
                  />
                  Auto-send receipt after generation
                </label>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] lg:sticky lg:top-4 lg:self-start">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#246392]">
              <FileText className="h-4 w-4" /> Invoice preview
              {previewLoading && (
                <span className="text-xs font-normal text-slate-400">Updating…</span>
              )}
            </h3>
            <div className="rounded-lg border border-slate-200 p-4 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <div className="border-b border-[#246392] pb-3">
                <p className="text-lg font-bold text-[#1a3a5c]">{previewData.companyName || 'Sriram IAS'}</p>
                <p className="text-xs text-[#686868]">Tax Invoice Preview · FY {previewData.financialYear}</p>
              </div>
              <div className="mt-4 space-y-2">
                <p><span className="text-[#686868]">Invoice #:</span> <span className="font-semibold">{previewData.invoiceNumber}</span></p>
                <p><span className="text-[#686868]">Receipt #:</span> <span className="font-semibold">{previewData.receiptNumber}</span></p>
                <p><span className="text-[#686868]">GST rate:</span> {previewData.gstRateLabel}</p>
              </div>
              <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span className="text-[#686868]">Taxable amount</span>
                  <span>{formatINR(previewData.taxableAmount)}</span>
                </div>
                {previewData.showTaxRows && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#686868]">CGST ({previewData.cgstRate}%)</span>
                      <span>{formatINR(previewData.cgst)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#686868]">SGST ({previewData.sgstRate}%)</span>
                      <span>{formatINR(previewData.sgst)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t border-[#246392] pt-2 font-bold text-[#1a3a5c]">
                  <span>Total</span>
                  <span>{formatINR(previewData.total)}</span>
                </div>
              </div>
              {(previewData.branchFormatExamples?.length ?? 0) > 0 && (
                <p className="mt-4 text-center text-[10px] text-[#9ca0a8]">
                  Branch format: {previewData.branchFormatExamples.join(' · ')}
                </p>
              )}
            </div>
            {isDirty && (
              <p className="mt-3 text-xs font-medium text-[#efb36d]">You have unsaved changes</p>
            )}
          </div>
        </form>
      )}
    </FinancePageShell>
  )
}
