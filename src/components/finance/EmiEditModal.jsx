import { useCallback, useMemo, useRef, useState } from 'react'
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
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import {
  addMonthsToDate,
  computeCurrentPlanAnalytics,
  getEmiMonthLabel,
  installmentNetAmount,
  rebalanceInstallmentAmounts,
} from '../../utils/emiSchedule'
import {
  appendPlanHistory,
  appendRowHistory,
  normalizeEmiPlan,
  normalizeInstallment,
  recalcPlanFromInstallments,
  validateEmiEditPlan,
} from '../../utils/emiEditModel'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

function emptyInstallment(no, plan) {
  const prev = plan?.installments?.[plan.installments.length - 1]
  const dueDate = prev?.dueDate ? addMonthsToDate(prev.dueDate, 1) : new Date().toISOString().slice(0, 10)
  return normalizeInstallment(
    {
      installmentNo: no,
      dueDate,
      emiAmount: 0,
      status: 'Due',
      paidAmount: 0,
    },
    no - 1,
  )
}

export default function EmiEditModal({ open, onClose, plan: planProp, onSubmit, saving = false }) {
  const [plan, setPlan] = useState(null)
  const [installments, setInstallments] = useState([])
  const [customizeIndex, setCustomizeIndex] = useState(null)
  const [payIndex, setPayIndex] = useState(null)
  const [earlyClosureOpen, setEarlyClosureOpen] = useState(false)

  const planRef = useRef(planProp)
  planRef.current = planProp
  const editKey = getModalEditKey(planProp)

  useInitOnModalOpen(open, editKey, () => {
    const normalized = normalizeEmiPlan(planRef.current)
    setPlan(normalized)
    setInstallments(normalized?.installments ? [...normalized.installments] : [])
    setCustomizeIndex(null)
    setPayIndex(null)
    setEarlyClosureOpen(false)
  })

  const analytics = useMemo(
    () => computeCurrentPlanAnalytics({ schedule: installments }),
    [installments],
  )

  const planClosed = plan?.planStatus === 'Closed Early'

  const displayPlan = useMemo(() => {
    if (!plan) return null
    return recalcPlanFromInstallments(plan, installments)
  }, [plan, installments])

  const pendingBalance = displayPlan?.pendingAmount ?? 0

  const updateInstallments = useCallback((updater) => {
    setInstallments((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next.map((r, i) => normalizeInstallment(r, i))
    })
  }, [])

  const handleCustomizeSave = useCallback(
    (updated) => {
      const { rebalanceRemaining, ...row } = updated
      updateInstallments((rows) => {
        let next = rows.map((r, i) => {
          if (i !== customizeIndex) return r
          return appendRowHistory(
            {
              ...r,
              emiAmount: row.emiAmount,
              dueDate: row.dueDate,
              emiDate: row.dueDate,
              emiMonth: row.emiMonth,
              lateFee: row.lateFee,
              discount: row.discount,
              customCharge: row.customCharge,
            },
            'Installment customized',
          )
        })

        if (rebalanceRemaining && plan) {
          const expectedPrincipal =
            plan.totalFees ||
            rows.reduce((sum, r) => sum + (Number(r.emiAmount) || 0), 0)
          next = rebalanceInstallmentAmounts(
            next,
            row.installmentNo,
            row.emiAmount,
            expectedPrincipal,
          )
        }

        return next
      })
      toast.success(`Installment #${row.installmentNo} updated`)
    },
    [customizeIndex, plan, updateInstallments],
  )

  const handlePaySave = useCallback(
    (updated) => {
      updateInstallments((rows) =>
        rows.map((r, i) => {
          if (i !== payIndex) return r
          let merged = {
            ...r,
            status: updated.status,
            paymentMode: updated.paymentMode,
            receiptNumber: updated.receiptNumber,
            referenceNumber: updated.referenceNumber,
            utrNumber: updated.referenceNumber,
            paidDate: updated.paidDate,
            remarks: updated.remarks,
            proofFileName: updated.proofFileName ?? r.proofFileName,
            proofUrl: updated.proofUrl ?? r.proofUrl,
            proofDataUrl: updated.proofDataUrl ?? r.proofDataUrl,
          }
          if (
            merged.status === 'Paid' &&
            (Number(merged.paidAmount) || 0) < installmentNetAmount(merged) - 0.5
          ) {
            merged.paidAmount = installmentNetAmount(merged)
          }
          return appendRowHistory(merged, 'Payment saved')
        }),
      )
      toast.success(`Payment saved for installment #${updated.installmentNo}`)
    },
    [payIndex, updateInstallments],
  )

  const handleAddInstallment = () => {
    updateInstallments((rows) => [...rows, emptyInstallment(rows.length + 1, { installments: rows })])
    setPlan((p) => ({
      ...p,
      planHistory: appendPlanHistory(p?.planHistory, 'Added new installment'),
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const finalPlan = recalcPlanFromInstallments(plan, installments)
    const errors = validateEmiEditPlan(finalPlan, installments)
    if (errors.length) {
      errors.forEach((msg) => toast.error(msg))
      return
    }
    onSubmit?.(installments, {
      planId: plan?.id,
      plan: finalPlan,
      isEdit: true,
    })
  }

  const handleReset = () => {
    const normalized = normalizeEmiPlan(planRef.current)
    setPlan(normalized)
    setInstallments(normalized?.installments ? [...normalized.installments] : [])
    toast.message('Changes reset')
  }

  const customizeRow = customizeIndex != null ? installments[customizeIndex] : null
  const payRow = payIndex != null ? installments[payIndex] : null
  const rowLocked = (row) => planClosed || (row && ['Closed'].includes(row.status))
  const customizeLocked = rowLocked(customizeRow)
  const payLocked = rowLocked(payRow)

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
            <EmiEditSummaryCard plan={displayPlan} analytics={analytics} />

            <EmiEarlyClosurePanel
              remainingBalance={pendingBalance}
              planStatus={plan?.planStatus}
              disabled={planClosed || saving}
              onCloseEmi={() => setEarlyClosureOpen(true)}
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={planClosed}
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
                className="min-w-[120px] rounded-full bg-gradient-to-r from-[#5eb8f5] to-[#2b78a5] px-8 py-3 text-sm font-bold text-white shadow-md"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={saving}
                className={cn(
                  'min-w-[160px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-8 py-3 text-sm font-bold text-white shadow-md',
                  saving && 'opacity-60',
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
        locked={customizeLocked}
        onClose={() => setCustomizeIndex(null)}
        onSave={handleCustomizeSave}
      />

      <EmiPayInstallmentModal
        open={payIndex != null}
        row={payRow}
        locked={payLocked}
        onClose={() => setPayIndex(null)}
        onSave={handlePaySave}
      />

      <EmiEarlyClosureDialog
        open={earlyClosureOpen}
        pendingBalance={pendingBalance}
        onClose={() => setEarlyClosureOpen(false)}
      />
    </>
  )
}
