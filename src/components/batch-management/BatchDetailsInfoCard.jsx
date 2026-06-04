import { BookMarked, Pencil } from 'lucide-react'
import BatchStatusBadge from './BatchStatusBadge'
import { formatBatchDate } from '../../data/batchManagementData'

function InfoItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#111]">{children}</p>
    </div>
  )
}

export default function BatchDetailsInfoCard({ batch, onEdit }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#cbeeff] text-[#246392]">
            <BookMarked className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-[#1a3a5c] sm:text-2xl">{batch.displayName}</h1>
            <p className="mt-1 font-mono text-sm font-semibold text-[#246392]">{batch.batchId}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <BatchStatusBadge status={batch.status} />
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98]"
            >
              <Pencil className="h-4 w-4" />
              Edit Batch
            </button>
          )}
        </div>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoItem label="Course">{batch.courseName}</InfoItem>
        <InfoItem label="Faculty / Trainer">{batch.trainerName}</InfoItem>
        <InfoItem label="Start Date">{formatBatchDate(batch.startDate)}</InfoItem>
        <InfoItem label="End Date">{formatBatchDate(batch.endDate)}</InfoItem>
        <InfoItem label="Total Students">{batch.totalStudents}</InfoItem>
        <InfoItem label="Batch Status">
          <BatchStatusBadge status={batch.status} />
        </InfoItem>
        {batch.mergedIntoName && (
          <InfoItem label="Merge Reference">
            <span className="text-[#246392]">Merged Into: {batch.mergedIntoName}</span>
          </InfoItem>
        )}
      </dl>
    </div>
  )
}
