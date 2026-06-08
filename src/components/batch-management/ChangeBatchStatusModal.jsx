import { useEffect, useState } from 'react'
import BatchFormModalShell from './BatchFormModalShell'
import { BatchModalFooter } from './batchModalUi'
import BatchStatusSelector from './BatchStatusSelector'
import BatchStatusBadge from './BatchStatusBadge'

export default function ChangeBatchStatusModal({
  open,
  onClose,
  batch,
  onSubmit,
  saving = false,
}) {
  const [nextStatus, setNextStatus] = useState(batch?.status || 'Active')

  useEffect(() => {
    if (open && batch) setNextStatus(batch.status || 'Active')
  }, [open, batch])

  if (!batch) return null

  const handleClose = () => {
    setNextStatus(batch.status || 'Active')
    onClose?.()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (nextStatus === batch.status) {
      handleClose()
      return
    }
    onSubmit?.(nextStatus)
  }

  return (
    <BatchFormModalShell
      open={open}
      onClose={handleClose}
      title="Change Batch Status"
      subtitle={batch.displayName}
      size="md"
      saving={saving}
      footer={
        <BatchModalFooter
          onCancel={handleClose}
          submitLabel={saving ? 'Updating…' : 'Update Status'}
          saving={saving}
          submitDisabled={nextStatus === batch.status}
          submitForm="change-batch-status-form"
          submitType="submit"
        />
      }
    >
      <form id="change-batch-status-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl bg-[#f8fbff] p-4 ring-1 ring-[#55ace7]/15">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">
            Current Status
          </p>
          <div className="mt-2">
            <BatchStatusBadge status={batch.status} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#686868]">
            New Status
          </p>
          <BatchStatusSelector
            status={nextStatus}
            onStatusChange={setNextStatus}
          />
        </div>
      </form>
    </BatchFormModalShell>
  )
}
