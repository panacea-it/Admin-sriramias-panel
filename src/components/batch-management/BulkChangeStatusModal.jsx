import { useEffect, useState } from 'react'
import BatchFormModalShell from './BatchFormModalShell'
import { BatchModalFooter } from './batchModalUi'
import BatchStatusSelector from './BatchStatusSelector'

export default function BulkChangeStatusModal({
  open,
  onClose,
  count,
  onSubmit,
  saving = false,
}) {
  const [status, setStatus] = useState('Active')

  useEffect(() => {
    if (open) setStatus('Active')
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.(status)
  }

  return (
    <BatchFormModalShell
      open={open}
      onClose={onClose}
      title="Bulk Change Status"
      subtitle={`${count} batch(es) selected`}
      size="md"
      saving={saving}
      footer={
        <BatchModalFooter
          onCancel={onClose}
          submitLabel={saving ? 'Updating…' : 'Apply to All'}
          saving={saving}
          submitForm="bulk-status-form"
          submitType="submit"
        />
      }
    >
      <form id="bulk-status-form" onSubmit={handleSubmit}>
        <p className="mb-3 text-sm text-[#686868]">Choose the new status for all selected batches.</p>
        <BatchStatusSelector status={status} onStatusChange={setStatus} />
      </form>
    </BatchFormModalShell>
  )
}
