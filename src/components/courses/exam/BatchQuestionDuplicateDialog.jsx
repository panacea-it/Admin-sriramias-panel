import Modal from '../../ui/Modal'
import { MERGE_REPLACE, MERGE_RENAME, MERGE_SKIP } from '../../../utils/batchQuestionMerge'

export default function BatchQuestionDuplicateDialog({
  open,
  conflictCount = 0,
  onClose,
  onResolve,
}) {
  if (!open) return null

  return (
    <Modal open={open} onClose={onClose} size="md" title="Duplicate question numbers">
      <div className="rounded-2xl bg-white p-6 shadow-xl">
        <p className="text-sm leading-relaxed text-[#444]">
          <strong className="text-[#1a3a5c]">{conflictCount}</strong> uploaded question
          {conflictCount === 1 ? '' : 's'} use numbers that already exist in this test.
          How should we handle them?
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <button
            type="button"
            onClick={() => onResolve?.(MERGE_SKIP)}
            className="rounded-full border border-[#cfe8f7] bg-white px-5 py-2.5 text-sm font-semibold text-[#246392] transition hover:bg-[#eef6fc]"
          >
            Skip duplicates
          </button>
          <button
            type="button"
            onClick={() => onResolve?.(MERGE_RENAME)}
            className="rounded-full border border-[#cfe8f7] bg-[#eef6fc] px-5 py-2.5 text-sm font-semibold text-[#1a3a5c] transition hover:bg-[#e8f4fc]"
          >
            Rename automatically
          </button>
          <button
            type="button"
            onClick={() => onResolve?.(MERGE_REPLACE)}
            className="rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
          >
            Replace existing
          </button>
        </div>
      </div>
    </Modal>
  )
}
