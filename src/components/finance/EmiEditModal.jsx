import { useCallback, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Plus } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import ProofViewerModal from './ProofViewerModal'
import EmiEditSummaryCard from './emi-edit/EmiEditSummaryCard'
import EmiEditInstallmentTable from './emi-edit/EmiEditInstallmentTable'
import EmiEarlyClosureDialog from './emi-edit/EmiEarlyClosureDialog'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import {
  addMonthsToDate,
  computeCurrentPlanAnalytics,
  getEmiMonthLabel,
} from '../../utils/emiSchedule'
import {
  appendPlanHistory,
  appendRowHistory,
  applyEarlyClosureToPlan,
  deriveInstallmentStatus,
  downloadProof,
  normalizeEmiPlan,
  normalizeInstallment,
  readProofFile,
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
  const [proofView, setProofView] = useState(null)
  const [closureOpen, setClosureOpen] = useState(false)
  const [proofUploadIndex, setProofUploadIndex] = useState(null)
  const proofInputRef = useRef(null)

  const planRef = useRef(planProp)
  planRef.current = planProp
  const editKey = getModalEditKey(planProp)

  useInitOnModalOpen(open, editKey, () => {
    const normalized = normalizeEmiPlan(planRef.current)
    setPlan(normalized)
    setInstallments(normalized?.installments ? [...normalized.installments] : [])
    setProofView(null)
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

  const updateInstallments = useCallback((updater) => {
    setInstallments((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next.map((r, i) => normalizeInstallment(r, i))
    })
  }, [])

  const onFieldChange = (index, key, value) => {
    updateInstallments((rows) =>
      rows.map((row, i) => {
        if (i !== index) return row
        const next = { ...row, [key]: value }
        if (key === 'utrNumber') {
          next.referenceNumber = value
        }
        if (key === 'dueDate') {
          next.emiDate = value
          next.emiMonth = getEmiMonthLabel(value)
        }
        if (['emiAmount', 'paidAmount', 'lateFee', 'discount', 'customCharge'].includes(key)) {
          next[key] = value === '' ? '' : Number(value)
          next.status = deriveInstallmentStatus(next)
        }
        return next
      }),
    )
  }

  const handleAddInstallment = () => {
    updateInstallments((rows) => [...rows, emptyInstallment(rows.length + 1, { installments: rows })])
    setPlan((p) => ({
      ...p,
      planHistory: appendPlanHistory(p?.planHistory, 'Added new installment'),
    }))
  }

  const handleProofFile = async (e) => {
    const file = e.target.files?.[0]
    const index = proofUploadIndex
    e.target.value = ''
    setProofUploadIndex(null)
    if (!file || index == null) return
    try {
      const proof = await readProofFile(file)
      updateInstallments((rows) =>
        rows.map((r, i) =>
          i === index
            ? appendRowHistory(
                { ...r, ...proof },
                proof.proofFileName ? `Uploaded proof: ${proof.proofFileName}` : 'Uploaded proof',
              )
            : r,
        ),
      )
      toast.success('Proof uploaded')
    } catch (err) {
      toast.error(err.message || 'Invalid file')
    }
  }

  const handleEarlyClosure = async ({ amount, remarks, proofFileName, proofUrl, proofDataUrl }) => {
    const { plan: closedPlan, installments: closedRows } = applyEarlyClosureToPlan(
      plan,
      installments,
      { amount, remarks, proofFileName, proofUrl },
    )
    const receiptNumber = `RCP-CLOSE-${Date.now().toString().slice(-6)}`
    const firstOpen = closedRows.findIndex((r) => r.status === 'Closed')
    const updated =
      firstOpen >= 0
        ? closedRows.map((r, i) =>
            i === firstOpen
              ? {
                  ...r,
                  receiptNumber,
                  proofFileName: proofFileName || r.proofFileName,
                  proofUrl: proofUrl || r.proofUrl,
                  proofDataUrl,
                  paidAmount: amount,
                  paymentMode: 'Cash',
                  paidDate: new Date().toISOString().slice(0, 10),
                }
              : r,
          )
        : closedRows
    setPlan(closedPlan)
    setInstallments(updated)
    toast.success('EMI closed early — closure receipt generated')
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
              {!planClosed && (displayPlan?.pendingAmount ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setClosureOpen((open) => !open)}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                >
                  Close EMI Early
                </button>
              )}
            </div>

            <EmiEarlyClosureDialog
              open={closureOpen}
              onClose={() => setClosureOpen(false)}
              pendingBalance={displayPlan?.pendingAmount ?? 0}
              onConfirm={handleEarlyClosure}
            />

            <EmiEditInstallmentTable
              installments={installments}
              planClosed={planClosed}
              onFieldChange={onFieldChange}
              onUploadProof={(index) => {
                setProofUploadIndex(index)
                proofInputRef.current?.click()
              }}
              onViewProof={(index) => setProofView(installments[index])}
              onDownloadProof={(index) => {
                if (!downloadProof(installments[index])) toast.error('No proof file to download')
              }}
            />

            <p className="text-xs text-[#686868]">
              Student-submitted payment details appear automatically when available. Otherwise,
              enter payment mode, receipt, UTR, proof, paid amount, and date directly in the table.
              Balance and status update automatically from the paid amount.
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

      <input
        ref={proofInputRef}
        type="file"
        accept="image/jpeg,image/png,image/jpg,application/pdf,.pdf"
        className="hidden"
        onChange={handleProofFile}
      />

      <ProofViewerModal
        open={!!proofView}
        onClose={() => setProofView(null)}
        title={`Proof — EMI #${proofView?.installmentNo}`}
        proofUrl={proofView?.proofDataUrl || proofView?.proofUrl}
        proofName={proofView?.proofFileName}
        utr={proofView?.utrNumber}
        notes={proofView?.remarks}
      />

    </>
  )
}
