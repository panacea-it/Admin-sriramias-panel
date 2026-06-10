import { useCallback, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
<<<<<<< HEAD
import { CalendarClock, Plus } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import ProofViewerModal from './ProofViewerModal'
import EmiEditSummaryCard from './emi-edit/EmiEditSummaryCard'
import EmiEditInstallmentTable from './emi-edit/EmiEditInstallmentTable'
=======
import { CalendarClock, History, Plus, Scissors, GitMerge } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import ProofViewerModal from './ProofViewerModal'
import ReceiptPreview from './ReceiptPreview'
import EmiInstallmentCollectDialog from './offline-payment/EmiInstallmentCollectDialog'
import EmiInstallmentEditDialog from './offline-payment/EmiInstallmentEditDialog'
import EmiEditSummaryCard from './emi-edit/EmiEditSummaryCard'
import EmiEditInstallmentTable from './emi-edit/EmiEditInstallmentTable'
import EmiEditHistoryDrawer from './emi-edit/EmiEditHistoryDrawer'
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
import EmiEarlyClosureDialog from './emi-edit/EmiEarlyClosureDialog'
import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'
import {
  addMonthsToDate,
  computeCurrentPlanAnalytics,
<<<<<<< HEAD
  getEmiMonthLabel,
=======
  generateEmiSchedule,
  getEmiMonthLabel,
  installmentNetAmount,
  installmentPaidAmount,
  installmentRemaining,
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
} from '../../utils/emiSchedule'
import {
  appendPlanHistory,
  appendRowHistory,
  applyEarlyClosureToPlan,
<<<<<<< HEAD
  deriveInstallmentStatus,
  downloadProof,
=======
  buildEmiReceiptPayment,
  canDeleteInstallment,
  downloadProof,
  mergeInstallmentWithNext,
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
  normalizeEmiPlan,
  normalizeInstallment,
  readProofFile,
  recalcPlanFromInstallments,
<<<<<<< HEAD
=======
  splitInstallmentAt,
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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
<<<<<<< HEAD
  const [proofView, setProofView] = useState(null)
=======
  const [editingRow, setEditingRow] = useState(null)
  const [collectRow, setCollectRow] = useState(null)
  const [advancedEditRow, setAdvancedEditRow] = useState(null)
  const [proofView, setProofView] = useState(null)
  const [receiptView, setReceiptView] = useState(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [rowHistoryFocus, setRowHistoryFocus] = useState(null)
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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
<<<<<<< HEAD
    setProofView(null)
=======
    setEditingRow(null)
    setCollectRow(null)
    setAdvancedEditRow(null)
    setProofView(null)
    setReceiptView(null)
    setRowHistoryFocus(null)
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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

<<<<<<< HEAD
=======
  const allInstallmentHistory = useMemo(() => {
    const rows = installments.flatMap((r) =>
      (r.paymentHistory || []).map((h) => ({ ...h, installmentNo: r.installmentNo })),
    )
    if (rowHistoryFocus != null) {
      const row = installments[rowHistoryFocus]
      return (row?.paymentHistory || []).map((h) => ({ ...h, installmentNo: row.installmentNo }))
    }
    return rows
  }, [installments, rowHistoryFocus])

>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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
<<<<<<< HEAD
        if (['emiAmount', 'paidAmount', 'lateFee', 'discount', 'customCharge'].includes(key)) {
          next[key] = value === '' ? '' : Number(value)
          next.status = deriveInstallmentStatus(next)
=======
        if (key === 'emiAmount' || key === 'paidAmount') {
          next[key] = value === '' ? '' : Number(value)
        }
        if (key === 'paidAmount' || key === 'status') {
          const due = installmentNetAmount(next)
          const paid = Number(next.paidAmount) || 0
          if (paid > 0 && paid < due - 0.5) next.status = 'Partial'
          else if (paid >= due - 0.5 && paid > 0) next.status = 'Paid'
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
        }
        return next
      }),
    )
  }

<<<<<<< HEAD
=======
  const handleSaveRow = (index) => {
    const row = installments[index]
    updateInstallments((rows) =>
      rows.map((r, i) =>
        i === index
          ? appendRowHistory(normalizeInstallment(r, i), 'Installment row saved')
          : r,
      ),
    )
    setPlan((p) => ({
      ...p,
      planHistory: appendPlanHistory(p?.planHistory, `Updated installment #${row.installmentNo}`),
    }))
    setEditingRow(null)
    toast.success(`Installment #${row.installmentNo} saved`)
  }

  const handleCollect = (updatedRow) => {
    const idx = installments.findIndex((r) => r.installmentNo === updatedRow.installmentNo)
    if (idx < 0) return
    updateInstallments((rows) => rows.map((r, i) => (i === idx ? normalizeInstallment(updatedRow, i) : r)))
    setPlan((p) => ({
      ...p,
      planHistory: appendPlanHistory(
        p?.planHistory,
        `Collected payment on EMI #${updatedRow.installmentNo}`,
      ),
    }))
    toast.success('Payment recorded')
  }

  const handleAdvancedSave = (updatedRow) => {
    const idx = installments.findIndex((r) => r.installmentNo === updatedRow.installmentNo)
    if (idx < 0) return
    let rows = installments.map((r, i) =>
      i === idx
        ? appendRowHistory(normalizeInstallment(updatedRow, i), 'Advanced installment edit saved')
        : r,
    )
    if (updatedRow.rebalanceRemaining) {
      const paidSum = rows.reduce((s, r) => s + installmentPaidAmount(r), 0)
      const principal = Math.max(0, (plan?.totalFees || 0) - paidSum)
      const openCount = rows.filter((r) => !['Paid', 'Partial', 'Closed'].includes(r.status)).length
      const { installments: regen } = generateEmiSchedule({
        installmentCount: Math.max(1, openCount),
        pendingBalance: principal,
        startDate: rows.find((r) => !['Paid', 'Closed'].includes(r.status))?.dueDate || rows[0]?.dueDate,
      })
      let gi = 0
      rows = rows.map((r) => {
        if (['Paid', 'Partial', 'Closed'].includes(r.status)) return r
        const g = regen[gi]
        gi += 1
        return g ? { ...r, emiAmount: g.emiAmount, emiMonth: g.emiMonth } : r
      })
    }
    updateInstallments(rows)
    setPlan((p) => ({
      ...p,
      planHistory: appendPlanHistory(p?.planHistory, `Advanced edit on EMI #${updatedRow.installmentNo}`),
    }))
    toast.success('Installment updated')
  }

>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
  const handleAddInstallment = () => {
    updateInstallments((rows) => [...rows, emptyInstallment(rows.length + 1, { installments: rows })])
    setPlan((p) => ({
      ...p,
      planHistory: appendPlanHistory(p?.planHistory, 'Added new installment'),
    }))
  }

<<<<<<< HEAD
=======
  const handleDelete = (index) => {
    const row = installments[index]
    if (!canDeleteInstallment(row)) {
      toast.error('Cannot delete paid or partial installments')
      return
    }
    updateInstallments((rows) =>
      rows.filter((_, i) => i !== index).map((r, i) => ({ ...r, installmentNo: i + 1, emiNo: i + 1 })),
    )
    setPlan((p) => ({
      ...p,
      planHistory: appendPlanHistory(p?.planHistory, `Deleted installment #${row.installmentNo}`),
    }))
  }

  const handleSplit = () => {
    if (editingRow == null) {
      toast.message('Select a row and click Edit, or use advanced edit')
      return
    }
    updateInstallments((rows) => splitInstallmentAt(rows, editingRow))
    setPlan((p) => ({
      ...p,
      planHistory: appendPlanHistory(p?.planHistory, 'Split installment'),
    }))
    setEditingRow(null)
  }

  const handleMerge = () => {
    if (editingRow == null || editingRow >= installments.length - 1) {
      toast.error('Select an unpaid row (not the last) to merge with next')
      return
    }
    updateInstallments((rows) => mergeInstallmentWithNext(rows, editingRow))
    setPlan((p) => ({
      ...p,
      planHistory: appendPlanHistory(p?.planHistory, 'Merged installments'),
    }))
    setEditingRow(null)
  }

>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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

<<<<<<< HEAD
=======
  const handleGenerateReceipt = (index) => {
    const row = installments[index]
    const receiptNumber = row.receiptNumber || `RCP-EMI-${plan?.id}-${row.installmentNo}`
    updateInstallments((rows) =>
      rows.map((r, i) =>
        i === index
          ? appendRowHistory(
              {
                ...r,
                receiptNumber,
                collectedBy: r.collectedBy || 'Finance Admin',
              },
              `Generated receipt ${receiptNumber}`,
            )
          : r,
      ),
    )
    toast.success('Receipt generated')
  }

>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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
<<<<<<< HEAD
=======
    setEditingRow(null)
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
    toast.message('Changes reset')
  }

  if (!open) return null

  return (
    <>
      <Modal open={open} onClose={onClose} size="full" title="Edit EMI Installments">
        <form
          onSubmit={handleSubmit}
          className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-[#f0f4f8] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
        >
          <ModalPanelHeader
            title="Edit EMI Installments"
<<<<<<< HEAD
=======
            onBack={onClose}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
            icon={CalendarClock}
            iconClassName="text-[#246392]"
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
<<<<<<< HEAD
                  onClick={() => setClosureOpen((open) => !open)}
=======
                  onClick={() => setClosureOpen(true)}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100"
                >
                  Close EMI Early
                </button>
              )}
<<<<<<< HEAD
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
=======
              <button
                type="button"
                onClick={handleSplit}
                disabled={planClosed}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#444] hover:bg-slate-50 disabled:opacity-50"
              >
                <Scissors className="h-3.5 w-3.5" />
                Split selected
              </button>
              <button
                type="button"
                onClick={handleMerge}
                disabled={planClosed}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#444] hover:bg-slate-50 disabled:opacity-50"
              >
                <GitMerge className="h-3.5 w-3.5" />
                Merge with next
              </button>
              <button
                type="button"
                onClick={() => {
                  setRowHistoryFocus(null)
                  setHistoryOpen(true)
                }}
                className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#246392] hover:bg-[#eef6fc]"
              >
                <History className="h-4 w-4" />
                EMI History
              </button>
            </div>

            <EmiEditInstallmentTable
              installments={installments}
              planClosed={planClosed}
              editingRow={editingRow}
              onStartEdit={(index) => setEditingRow(index)}
              onAdvancedEdit={(index) => setAdvancedEditRow(installments[index])}
              onCancelEdit={() => setEditingRow(null)}
              onSaveRow={handleSaveRow}
              onFieldChange={onFieldChange}
              onCollect={(index) => setCollectRow(installments[index])}
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
              onUploadProof={(index) => {
                setProofUploadIndex(index)
                proofInputRef.current?.click()
              }}
              onViewProof={(index) => setProofView(installments[index])}
              onDownloadProof={(index) => {
                if (!downloadProof(installments[index])) toast.error('No proof file to download')
              }}
<<<<<<< HEAD
            />

            <p className="text-xs text-[#686868]">
              Student-submitted payment details appear automatically when available. Otherwise,
              enter payment mode, receipt, UTR, proof, paid amount, and date directly in the table.
              Balance and status update automatically from the paid amount.
=======
              onViewReceipt={(index) => setReceiptView(buildEmiReceiptPayment(plan, installments[index]))}
              onGenerateReceipt={handleGenerateReceipt}
              onViewHistory={(index) => {
                setRowHistoryFocus(index)
                setHistoryOpen(true)
              }}
              onDelete={handleDelete}
            />

            <p className="text-xs text-[#686868]">
              Tip: Click <strong>Edit</strong> on a row for inline changes, or use{' '}
              <strong>Collect payment</strong> for partial/offline collections with proof. Advanced
              fees (late fee, discount) open from the pencil → customize dialog.
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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

<<<<<<< HEAD
=======
      <EmiInstallmentCollectDialog
        open={!!collectRow}
        row={collectRow}
        onClose={() => setCollectRow(null)}
        onCollect={handleCollect}
      />

      <EmiInstallmentEditDialog
        open={!!advancedEditRow}
        row={advancedEditRow}
        onClose={() => setAdvancedEditRow(null)}
        onSave={(row) => {
          handleAdvancedSave(row)
          setAdvancedEditRow(null)
        }}
      />

>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
      <ProofViewerModal
        open={!!proofView}
        onClose={() => setProofView(null)}
        title={`Proof — EMI #${proofView?.installmentNo}`}
        proofUrl={proofView?.proofDataUrl || proofView?.proofUrl}
        proofName={proofView?.proofFileName}
        utr={proofView?.utrNumber}
        notes={proofView?.remarks}
      />

<<<<<<< HEAD
=======
      <Modal
        open={!!receiptView}
        onClose={() => setReceiptView(null)}
        size="lg"
        title="EMI receipt"
      >
        <div className="max-h-[80vh] overflow-y-auto p-4">
          <ReceiptPreview
            payment={receiptView}
            onPrint={() => window.print()}
            onDownload={() => toast.success('Receipt download started')}
          />
        </div>
      </Modal>

      <EmiEditHistoryDrawer
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false)
          setRowHistoryFocus(null)
        }}
        planHistory={plan?.planHistory}
        installmentHistory={allInstallmentHistory}
      />

      <EmiEarlyClosureDialog
        open={closureOpen}
        onClose={() => setClosureOpen(false)}
        pendingBalance={displayPlan?.pendingAmount ?? 0}
        onConfirm={handleEarlyClosure}
      />
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
    </>
  )
}
