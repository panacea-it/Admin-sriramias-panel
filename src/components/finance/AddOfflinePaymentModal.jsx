import Modal from '../ui/Modal'
import { OFFLINE_PAYMENT_MODES, OFFLINE_SUBMIT_ACTIONS } from '../../constants/offlinePaymentEmi'
import { useOfflinePaymentEmiForm } from '../../hooks/useOfflinePaymentEmiForm'
import { toast } from '../../utils/toast'
import OfflinePaymentModalHeader from './offline-payment/OfflinePaymentModalHeader'
import PaymentTypeToggle from './offline-payment/PaymentTypeToggle'
import EditableStudentCard from './offline-payment/EditableStudentCard'
import EmiStrategyConfig from './offline-payment/EmiStrategyConfig'
import EmiScheduleTable from './offline-payment/EmiScheduleTable'
import EmiEarlyClosurePanel from './offline-payment/EmiEarlyClosurePanel'
import OfflinePaymentModeFields from './offline-payment/OfflinePaymentModeFields'
import OfflinePaymentFooter from './offline-payment/OfflinePaymentFooter'
import EmiInstallmentEditDialog from './offline-payment/EmiInstallmentEditDialog'
import EmiInstallmentCollectDialog from './offline-payment/EmiInstallmentCollectDialog'

const fieldClass =
  'mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25'

export default function AddOfflinePaymentModal({
  open,
  onClose,
  onSubmit,
  loading,
  initialStudentProfile,
}) {
  const form = useOfflinePaymentEmiForm({ open, initialStudentProfile })

  const {
    register,
    handleSubmit,
    paymentType,
    setPaymentType,
    emiEnabled,
    studentProfile,
    setStudentProfile,
    financials,
    installments,
    emiConfig,
    setEmiConfig,
    modeFields,
    setModeFields,
    proofFile,
    proofFiles,
    proofPreview,
    handleProofChange,
    handleProofFilesChange,
    clearProof,
    schedulePreview,
    validationErrors,
    editInstallment,
    setEditInstallment,
    collectInstallment,
    setCollectInstallment,
    collectDialogTitle,
    collectDefaultAmount,
    openEmiBalance,
    emiPlanStatus,
    statusLabel,
    handleSearchSelect,
    handleWalkIn,
    updateInstallment,
    collectInstallmentPayment,
    openCollectDialog,
    handleEarlyClosure,
    buildPayload,
    validate,
    paymentMode,
    paymentId,
    centerOptions,
    OFFLINE_SUBMIT_ACTIONS: ACTIONS,
  } = form

  const submitApprove = () =>
    handleSubmit((data) => {
      const errs = validate(data)
      if (errs.length > 0) {
        toast.error(errs[0])
        return
      }
      onSubmit?.(buildPayload(data, ACTIONS.APPROVE))
    })()

  const planClosed = emiPlanStatus === 'Closed Early'
  const batchError = validationErrors.includes('Batch is required.')
    ? 'Please select a batch.'
    : undefined

  const expectedEmiPrincipal = Math.max(
    0,
    (financials?.pendingAmount ?? 0) - (Number(emiConfig.downPayment) || 0),
  )

  const handleInlineAmountChange = (row, amount) => {
    updateInstallment({
      ...row,
      emiAmount: amount,
      rebalanceRemaining: false,
    })
  }

  return (
    <Modal open={open} onClose={onClose} size="full" title="Offline EMI Payment" showCloseButton={false}>
      <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-2xl bg-[#f4f6f9] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <OfflinePaymentModalHeader
          paymentId={paymentId}
          statusLabel={statusLabel}
          onClose={onClose}
        />

        <form
          onSubmit={(e) => {
            e.preventDefault()
            submitApprove()
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <input type="hidden" {...register('paymentId')} />

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
            <PaymentTypeToggle value={paymentType} onChange={setPaymentType} />

            <EditableStudentCard
              profile={studentProfile}
              onChange={setStudentProfile}
              centerOptions={centerOptions}
              financials={financials}
              onSearchSelect={handleSearchSelect}
              onWalkIn={handleWalkIn}
              batchError={batchError}
            />

            {emiEnabled ? (
              <div className="space-y-3">
                <EmiStrategyConfig
                  config={emiConfig}
                  onChange={setEmiConfig}
                  financials={financials}
                  schedulePreview={schedulePreview}
                  installments={installments}
                />

                <EmiEarlyClosurePanel
                  remainingBalance={openEmiBalance}
                  planStatus={emiPlanStatus}
                  disabled={planClosed || openEmiBalance <= 0}
                  onCloseEmi={handleEarlyClosure}
                />

                <div>
                  <h3 className="mb-2 text-sm font-bold text-[#246392]">Installment schedule</h3>
                  <EmiScheduleTable
                    installments={installments}
                    planClosed={planClosed}
                    onCollect={(row) => openCollectDialog(row)}
                    onEdit={setEditInstallment}
                    customLayout
                    expectedPrincipal={expectedEmiPrincipal}
                    onAmountChange={handleInlineAmountChange}
                  />
                </div>

                <label className="block text-xs font-semibold text-[#555]">
                  Plan start date
                  <input
                    type="date"
                    {...register('paymentDate', { required: true })}
                    className={fieldClass}
                  />
                </label>
              </div>
            ) : (
              <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-bold text-[#246392]">Full payment</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-[#555]">
                    Payment mode
                    <select {...register('paymentMode', { required: true })} className={fieldClass}>
                      {OFFLINE_PAYMENT_MODES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold text-[#555]">
                    Amount paid (₹) *
                    <input
                      type="number"
                      min="0"
                      {...register('amount', { required: true })}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[#555] sm:col-span-2">
                    Payment date *
                    <input
                      type="date"
                      {...register('paymentDate', { required: true })}
                      className={fieldClass}
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <OfflinePaymentModeFields
                      paymentMode={paymentMode}
                      register={register}
                      modeFields={modeFields}
                      setModeFields={setModeFields}
                      proofFile={proofFile}
                      proofFiles={proofFiles}
                      proofPreview={proofPreview}
                      onProofChange={handleProofChange}
                      onProofFilesChange={handleProofFilesChange}
                      onClearProof={clearProof}
                    />
                  </div>
                  <label className="block text-xs font-semibold text-[#555] sm:col-span-2">
                    Remarks
                    <textarea
                      {...register('remarks')}
                      rows={2}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#55ace7]"
                    />
                  </label>
                </div>
              </section>
            )}

            {validationErrors.length > 0 && (
              <ul className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                {validationErrors.map((err) => (
                  <li key={err}>• {err}</li>
                ))}
              </ul>
            )}
          </div>

          <OfflinePaymentFooter
            loading={loading}
            emiEnabled={emiEnabled}
            onCancel={onClose}
            onApprove={submitApprove}
          />
        </form>
      </div>

      <EmiInstallmentEditDialog
        open={!!editInstallment}
        row={editInstallment}
        onClose={() => setEditInstallment(null)}
        onSave={updateInstallment}
      />

      <EmiInstallmentCollectDialog
        open={!!collectInstallment}
        row={collectInstallment}
        title={collectDialogTitle}
        defaultAmount={collectDefaultAmount}
        onClose={() => setCollectInstallment(null)}
        onCollect={collectInstallmentPayment}
      />
    </Modal>
  )
}
