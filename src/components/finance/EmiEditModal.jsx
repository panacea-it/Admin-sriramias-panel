import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Plus } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import EmiEditSummaryCard from './emi-edit/EmiEditSummaryCard'
import EmiEditInstallmentTable from './emi-edit/EmiEditInstallmentTable'
import EmiCustomizeInstallmentModal from './emi-edit/EmiCustomizeInstallmentModal'
import EmiPayInstallmentModal from './emi-edit/EmiPayInstallmentModal'
import EmiEarlyClosureDialog from './emi-edit/EmiEarlyClosureDialog'
import EmiEarlyClosurePanel from './offline-payment/EmiEarlyClosurePanel'
import FinanceTableSkeleton from './FinanceTableSkeleton'
import { useInitOnModalOpen } from '../../hooks/modalFormSync'
import { computeCurrentPlanAnalytics } from '../../utils/emiSchedule'
import {
  normalizeEmiPlan,
  recalcPlanFromInstallments,
  validateEmiEditPlan,
} from '../../utils/emiEditModel'
import {
  fetchEmiDetails,
  customizeEmiInstallment,
  payEmiInstallment,
  closeEmiPlan,
  addEmiInstallment,
  saveEmiPlanLegacy,
} from '../../api/emiManagementAPI'
import {
  buildCustomizeInstallmentBody,
  buildPayInstallmentFormData,
  buildCloseEmiFormData,
  canCustomizeInstallment,
  canPayInstallment,
} from '../../utils/emiManagementHelpers'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

export default function EmiEditModal({
  open,
  onClose,
  emiPlanId,
  paymentModes = [],
  onComplete,
  saving: externalSaving = false,
}) {
  const [plan, setPlan] = useState(null)
  const [installments, setInstallments] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionSaving, setActionSaving] = useState(false)
  const [customizeIndex, setCustomizeIndex] = useState(null)
  const [payIndex, setPayIndex] = useState(null)
  const [earlyClosureOpen, setEarlyClosureOpen] = useState(false)

  const applyDetails = useCallback((details) => {
    const normalized = normalizeEmiPlan(details)
    setPlan(normalized)
    setInstallments(normalized?.installments ? [...normalized.installments] : [])
  }, [])

  const loadDetails = useCallback(async (planId) => {
    if (!planId) return
    setLoading(true)
    try {
      const details = await fetchEmiDetails(planId)
      applyDetails(details)
    } catch (err) {
      toast.error(err.message || 'Failed to load EMI details')
      onClose?.()
    } finally {
      setLoading(false)
    }
  }, [applyDetails, onClose])

  useInitOnModalOpen(open, emiPlanId, () => {
    setCustomizeIndex(null)
    setPayIndex(null)
    setEarlyClosureOpen(false)
  })

  useEffect(() => {
    if (!open || !emiPlanId) {
      setPlan(null)
      setInstallments([])
      return undefined
    }
    loadDetails(emiPlanId)
    return undefined
  }, [open, emiPlanId, loadDetails])

  const analytics = useMemo(
    () => computeCurrentPlanAnalytics({ schedule: installments }),
    [installments],
  )

  const planClosed =
    plan?.planStatus === 'Closed Early' ||
    plan?.emiStatusRaw === 'CLOSED' ||
    plan?.emiStatusRaw === 'EMI_COMPLETED'

  const displayPlan = useMemo(() => {
    if (!plan) return null
    return recalcPlanFromInstallments(plan, installments)
  }, [plan, installments])

  const pendingBalance = displayPlan?.pendingAmount ?? plan?.pendingAmount ?? 0
  const saving = externalSaving || actionSaving

  const refreshFromDetails = useCallback(
    async (details) => {
      if (details) {
        applyDetails(details)
        return details
      }
      if (!emiPlanId) return null
      const fresh = await fetchEmiDetails(emiPlanId)
      applyDetails(fresh)
      return fresh
    },
    [applyDetails, emiPlanId],
  )

  const handleCustomizeSave = useCallback(
    async (updated) => {
      if (!emiPlanId || customizeIndex == null) return
      const row = installments[customizeIndex]
      if (!row?._id) {
        toast.error('Installment ID missing')
        return
      }

      setActionSaving(true)
      try {
        const details = await customizeEmiInstallment(
          buildCustomizeInstallmentBody({
            emiPlanId,
            installmentId: row._id,
            row: updated,
            reason: updated.reason,
          }),
        )
        await refreshFromDetails(details)
        toast.success(`Installment #${updated.installmentNo} updated`)
        setCustomizeIndex(null)
      } catch (err) {
        toast.error(err.message || 'Failed to customize installment')
      } finally {
        setActionSaving(false)
      }
    },
    [emiPlanId, customizeIndex, installments, refreshFromDetails],
  )

  const handlePaySave = useCallback(
    async (updated, proofFile) => {
      if (!emiPlanId || payIndex == null) return
      const row = installments[payIndex]
      if (!row?._id) {
        toast.error('Installment ID missing')
        return
      }

      setActionSaving(true)
      try {
        const formData = buildPayInstallmentFormData({
          emiPlanId,
          installmentId: row._id,
          paymentModeId: updated.paymentModeId || updated.paymentMode,
          paymentDate: updated.paidDate,
          receiptNumber: updated.receiptNumber,
          referenceNumber: updated.referenceNumber || updated.utrNumber,
          remarks: updated.remarks,
          proofFile,
        })
        await payEmiInstallment(formData)
        await refreshFromDetails()
        toast.success(`Payment saved for installment #${updated.installmentNo}`)
        setPayIndex(null)
      } catch (err) {
        toast.error(err.message || 'Failed to record payment')
        throw err
      } finally {
        setActionSaving(false)
      }
    },
    [emiPlanId, payIndex, installments, refreshFromDetails],
  )

  const handleCloseEmi = useCallback(
    async (form, proofFile) => {
      if (!emiPlanId) return

      if (!proofFile) {
        toast.error('Payment proof is required for EMI closure')
        return
      }

      const amountCollected = Number(form.amount)
      if (amountCollected !== Number(pendingBalance)) {
        toast.error(`Amount must exactly equal pending balance (${pendingBalance})`)
        return
      }

      setActionSaving(true)
      try {
        const formData = buildCloseEmiFormData({
          emiPlanId,
          amountCollected,
          paymentModeId: form.paymentModeId || form.paymentMode,
          paymentDate: form.paymentDate,
          receiptNumber: form.receiptNumber,
          referenceNumber: form.referenceNumber,
          remarks: form.remarks,
          proofFile,
        })
        await closeEmiPlan(formData)
        toast.success('EMI closed successfully')
        setEarlyClosureOpen(false)
        onComplete?.()
        onClose?.()
      } catch (err) {
        toast.error(err.message || 'Failed to close EMI')
        throw err
      } finally {
        setActionSaving(false)
      }
    },
    [emiPlanId, pendingBalance, onComplete, onClose],
  )

  const handleAddInstallment = async () => {
    if (!emiPlanId || planClosed) return
    setActionSaving(true)
    try {
      const details = await addEmiInstallment(emiPlanId)
      await refreshFromDetails(details)
      toast.success('Installment added')
    } catch (err) {
      toast.error(err.message || 'Failed to add installment')
    } finally {
      setActionSaving(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!emiPlanId || !plan) return

    const finalPlan = recalcPlanFromInstallments(plan, installments)
    const errors = validateEmiEditPlan(finalPlan, installments)
    if (errors.length) {
      errors.forEach((msg) => toast.error(msg))
      return
    }

    setActionSaving(true)
    try {
      await saveEmiPlanLegacy({
        emiPlanId,
        installments: installments.map((row) => ({
          installmentId: row._id,
          installmentNo: row.installmentNo,
          dueDate: row.dueDate,
          emiAmount: row.emiAmount,
          paidAmount: row.paidAmount,
          status: row.statusRaw || row.status,
          lateFee: row.lateFee,
          discount: row.discount,
          customCharge: row.customCharge,
        })),
      })
      toast.success('EMI plan updated')
      onComplete?.()
      onClose?.()
    } catch (err) {
      toast.error(err.message || 'Failed to update EMI plan')
    } finally {
      setActionSaving(false)
    }
  }

  const handleReset = () => {
    if (emiPlanId) loadDetails(emiPlanId)
    toast.message('Changes reset')
  }

  const customizeRow = customizeIndex != null ? installments[customizeIndex] : null
  const payRow = payIndex != null ? installments[payIndex] : null
  const customizeLocked = planClosed || !canCustomizeInstallment(customizeRow)
  const payLocked = planClosed || !canPayInstallment(payRow)

  if (!open) return null

  return (
    <>
      <Modal open={open} onClose={onClose} size="full" title="Edit EMI Installments" showCloseButton={false}>
        <form
          onSubmit={handleSubmit}
          className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
        >
          <ModalPanelHeader
            title="Edit EMI Installments"
            icon={CalendarClock}
            iconClassName="text-[#246392]"
            onClose={onClose}
            closeVariant="icon"
          />

          <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-28 sm:p-5">
            {loading && !plan ? (
              <FinanceTableSkeleton rows={6} columns={6} />
            ) : (
              <>
                <EmiEditSummaryCard plan={displayPlan} analytics={analytics} />

                <EmiEarlyClosurePanel
                  remainingBalance={pendingBalance}
                  planStatus={plan?.planStatus}
                  disabled={planClosed || saving || pendingBalance <= 0}
                  onCloseEmi={() => setEarlyClosureOpen(true)}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={planClosed || saving}
                    onClick={handleAddInstallment}
                    className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#55ace7] bg-white px-3 py-2 text-sm font-semibold text-[#246392] hover:bg-[#eef6fc] disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                    Add Installment
                  </button>
                </div>

                <EmiEditInstallmentTable
                  installments={installments}
                  planClosed={planClosed}
                  onCustomize={setCustomizeIndex}
                  onPay={setPayIndex}
                />

                <p className="text-xs leading-relaxed text-[#686868]">
                  Use <span className="font-semibold text-[#246392]">Customize Installment</span> to
                  adjust amounts, dates, and fees. Use{' '}
                  <span className="font-semibold text-[#246392]">Pay</span> to record payment details.
                  Save the plan when finished.
                </p>
              </>
            )}
          </div>

          <motion.footer
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky bottom-0 z-20 border-t border-slate-200/90 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-md sm:px-6"
          >
            <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-w-[120px] rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-bold text-[#444] hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading || saving}
                className="min-w-[120px] rounded-full bg-gradient-to-r from-[#5eb8f5] to-[#2b78a5] px-8 py-3 text-sm font-bold text-white shadow-md disabled:opacity-60"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving || loading || !plan}
                className={cn(
                  'min-w-[160px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-8 py-3 text-sm font-bold text-white shadow-md',
                  (saving || loading) && 'opacity-60',
                )}
              >
                {saving ? 'Saving…' : 'Update EMI Plan'}
              </button>
            </div>
          </motion.footer>
        </form>
      </Modal>

      <EmiCustomizeInstallmentModal
        open={customizeIndex != null}
        row={customizeRow}
        locked={customizeLocked || saving}
        onClose={() => setCustomizeIndex(null)}
        onSave={handleCustomizeSave}
        saving={actionSaving}
      />

      <EmiPayInstallmentModal
        open={payIndex != null}
        row={payRow}
        locked={payLocked || saving}
        paymentModes={paymentModes}
        onClose={() => setPayIndex(null)}
        onSave={handlePaySave}
        saving={actionSaving}
      />

      <EmiEarlyClosureDialog
        open={earlyClosureOpen}
        pendingBalance={pendingBalance}
        paymentModes={paymentModes}
        saving={actionSaving}
        onClose={() => setEarlyClosureOpen(false)}
        onSave={handleCloseEmi}
      />
    </>
  )
}
