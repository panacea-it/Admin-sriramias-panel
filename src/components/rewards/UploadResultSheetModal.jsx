import { useEffect, useState } from 'react'
import RewardsModalShell, {
  RewardsModalCancelButton,
  RewardsModalField,
  RewardsModalPrimaryButton,
} from './RewardsModalShell'
import { REWARDS_MODAL_FIELD_GAP } from './rewardsModalUi'

const MAX_SIZE_MB = 10
const ACCEPT = '.csv,.xlsx,.xls,.pdf'

export default function UploadResultSheetModal({ open, onClose, onUpload, loading }) {
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) {
      setFile(null)
      setError('')
    }
  }, [open])

  const handleFileChange = (e) => {
    const next = e.target.files?.[0] ?? null
    setError('')
    if (next && next.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File must be ${MAX_SIZE_MB} MB or smaller`)
      setFile(null)
      return
    }
    setFile(next)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file) {
      setError('Select a file to upload')
      return
    }
    onUpload?.(file)
  }

  return (
    <RewardsModalShell
      open={open}
      onClose={onClose}
      title="Upload Result Sheet"
      description="Import OMR or result sheet data for reward reconciliation."
      footer={
        <>
          <RewardsModalCancelButton onClick={onClose} disabled={loading} />
          <RewardsModalPrimaryButton type="submit" form="upload-result-sheet-form" loading={loading}>
            Upload File
          </RewardsModalPrimaryButton>
        </>
      }
    >
      <form id="upload-result-sheet-form" onSubmit={handleSubmit} className={REWARDS_MODAL_FIELD_GAP}>
        <RewardsModalField
          label="Select File"
          error={error}
          hint={`Supported: CSV, Excel, PDF · Max ${MAX_SIZE_MB} MB`}
        >
          <input
            type="file"
            accept={ACCEPT}
            onChange={handleFileChange}
            className="block w-full cursor-pointer text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef2fc] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#246392]"
          />
        </RewardsModalField>
        {file && (
          <p className="text-sm font-medium text-slate-700">
            Selected: <span className="text-[#246392]">{file.name}</span>
          </p>
        )}
      </form>
    </RewardsModalShell>
  )
}
