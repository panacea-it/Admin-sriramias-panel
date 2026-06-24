import { BookMarked, Download, Eye, FileText, X } from 'lucide-react'
import Modal from '../ui/Modal'
import SectionBar from './SectionBar'
import CategoryStatusBadge from '../categories/CategoryStatusBadge'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { normalizeLinkedSubjects } from '../../utils/batchHelpers'
import { enrichLinkedSubjectsWithFaculty } from '../../utils/facultySubjectBatch'
import { formatLinkedSubjectDisplay } from '../../utils/batchHelpers'
import { resolveMentorDisplayName } from '../../utils/mentorEmployees'
import {
  downloadBrochurePdf,
  formatBrochureFileSize,
  resolveBrochureFileName,
  resolveBrochureFileSize,
  resolveBrochureUrl,
  viewBrochurePdf,
} from '../../utils/batchBrochure'
import { loadAcademicsSubjects } from '../../utils/academicsSubjectsStorage'
function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

function formatMoney(amount, currency = 'INR') {
  if (amount == null || amount === '') return null
  const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹'
  return `${symbol}${Number(amount).toLocaleString()}`
}

function hasFeeDetails(feeDetails) {
  if (!feeDetails) return false
  const {
    discountFee,
    onlinePaymentAmount,
    offlinePaymentAmount,
    onlinePaymentBullets = [],
    offlinePaymentBullets = [],
  } = feeDetails
  return (
    (discountFee != null && discountFee !== '') ||
    (onlinePaymentAmount != null && onlinePaymentAmount !== '') ||
    (offlinePaymentAmount != null && offlinePaymentAmount !== '') ||
    onlinePaymentBullets.length > 0 ||
    offlinePaymentBullets.length > 0
  )
}

function ReadOnlyBlock({ title, children }) {
  if (!children) return null
  return (
    <div className="space-y-3">
      <SectionBar title={title} />
      <div className="rounded-xl bg-white px-4 py-4 text-sm text-[#444] shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:px-6">
        {children}
      </div>
    </div>
  )
}

export default function ViewBatchModal({ open, onClose, item, loading = false }) {
  if (!open || !item) return null

  const form = item.formData || {}
  const bannerSrc = item.bannerPreview || form.bannerPreview || form.bannerUrl
  const brochureUrl = resolveBrochureUrl(item)
  const brochureFileName = resolveBrochureFileName(item)
  const brochureFileSize = resolveBrochureFileSize(item)
  const catalogName = item.linkedCourseName || item.courseName || form.courseName
  const feeDetails = item.feeDetails || form.feeDetails
  const linkedSubjects = enrichLinkedSubjectsWithFaculty(
    (() => {
      const list = normalizeLinkedSubjects({
        linkedSubjects: item.linkedSubjects || form.linkedSubjects,
      })
      if (list.length) return list
      const legacyId = item.linkedSubjectId || form.linkedSubjectId
      if (!legacyId) return []
      return [
        {
          subjectId: String(legacyId),
          subjectName: item.linkedSubjectName || form.linkedSubjectName || '',
        },
      ]
    })(),
    loadAcademicsSubjects(),
  )
  const showFee = hasFeeDetails(feeDetails)
  const currency = feeDetails?.currency || 'INR'

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="full"
      title={`View ${item.batchName || item.name}`}
      showCloseButton={false}
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#b8887a] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <BookMarked className="h-6 w-6 text-[#dc2626]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 text-white">
              <h2 className="truncate text-lg font-bold sm:text-xl">
                {item.batchName || item.name}
              </h2>
              <p className="text-sm text-white/85">{item.batchId || '—'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="relative max-h-[70vh] space-y-5 overflow-y-auto bg-[#f0f4f8] p-5 sm:p-6">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
            </div>
          )}
          <div className="rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:p-6">
            <h3 className="mb-4 border-b border-[#eef2fc] pb-2 text-sm font-bold uppercase tracking-wide text-[#246392]">
              Batch Details
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Batch ID">{item.batchId || '—'}</DetailItem>
              <DetailItem label="Batch Name">{item.batchName || item.name}</DetailItem>
              <DetailItem label="Mentor">{resolveMentorDisplayName(item)}</DetailItem>
              <DetailItem label="Linked Course">{catalogName || '—'}</DetailItem>
              <DetailItem label="Course ID">{item.courseId || '—'}</DetailItem>
              <DetailItem label="Date of Commencement">
                {item.commencement || form.commencement || '—'}
              </DetailItem>
              <DetailItem label="Duration">
                {item.durationLabel || form.durationLabel || '—'}
              </DetailItem>
              <DetailItem label="Batch Start Date">
                {item.batchStartFrom || form.batchStartFrom || '—'}
              </DetailItem>
              <DetailItem label="Batch End Date">
                {item.batchEndTo || form.batchEndTo || '—'}
              </DetailItem>
              <DetailItem label="Status">
                <CategoryStatusBadge status={item.status} />
              </DetailItem>
              <DetailItem label="Created On">
                {formatCategoryDateTime(item.createdAt)}
              </DetailItem>
              <DetailItem label="Modified On">
                {formatCategoryDateTime(item.modifiedAt)}
              </DetailItem>
              <div className="sm:col-span-2 lg:col-span-3">
                <DetailItem label="Linked Subjects">
                  {linkedSubjects.length ? (
                    <ul className="mt-1 space-y-1">
                      {linkedSubjects.map((s) => (
                        <li key={s.subjectId} className="text-sm font-semibold text-[#111]">
                          {formatLinkedSubjectDisplay(s)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    '—'
                  )}
                </DetailItem>
              </div>
            </dl>
            {bannerSrc ? (
              <div className="mt-4">
                <p className="text-xs font-medium text-[#686868]">Banner Image</p>
                <img
                  src={bannerSrc}
                  alt="Batch banner"
                  className="mt-2 max-h-48 rounded-lg border border-[#eef2fc] object-contain"
                />
              </div>
            ) : null}
            {brochureUrl ? (
              <div className="mt-4 rounded-xl border border-[#55ace7]/15 bg-[#f8fbff] p-4">
                <p className="text-xs font-medium text-[#686868]">Batch Brochure</p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-[#55ace7]/15">
                      <FileText className="h-5 w-5 text-[#246392]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#111]">
                        {brochureFileName}
                      </p>
                      {brochureFileSize != null ? (
                        <p className="text-xs text-[#686868]">
                          {formatBrochureFileSize(brochureFileSize)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => viewBrochurePdf(brochureUrl)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#55ace7]/20 bg-white px-3 text-xs font-semibold text-[#246392] transition hover:bg-[#eef6fc] sm:text-sm"
                    >
                      <Eye className="h-4 w-4" />
                      View PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadBrochurePdf(brochureUrl, brochureFileName)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#55ace7]/20 bg-white px-3 text-xs font-semibold text-[#246392] transition hover:bg-[#eef6fc] sm:text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {showFee ? (
            <ReadOnlyBlock title="Fee Details">
              <dl className="grid gap-3 sm:grid-cols-2">
                <DetailItem label="Currency">{currency}</DetailItem>
                <DetailItem label="Discount Fee">
                  {formatMoney(feeDetails.discountFee, currency) || '—'}
                </DetailItem>
                <DetailItem label="Online Payment Amount">
                  {formatMoney(feeDetails.onlinePaymentAmount, currency) || '—'}
                </DetailItem>
                <DetailItem label="Offline Payment Amount">
                  {formatMoney(feeDetails.offlinePaymentAmount, currency) || '—'}
                </DetailItem>
              </dl>
              {(feeDetails.onlinePaymentBullets || []).length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-[#246392]">
                    Online Payment – Bullet Points
                  </p>
                  <ul className="space-y-1">
                    {feeDetails.onlinePaymentBullets.map((line, i) => (
                      <li key={`on-${i}`} className="flex gap-2 text-sm">
                        <span className="text-[#55ace7]">•</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {(feeDetails.offlinePaymentBullets || []).length > 0 ? (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-semibold text-[#246392]">
                    Offline Payment – Bullet Points
                  </p>
                  <ul className="space-y-1">
                    {feeDetails.offlinePaymentBullets.map((line, i) => (
                      <li key={`off-${i}`} className="flex gap-2 text-sm">
                        <span className="text-[#55ace7]">•</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </ReadOnlyBlock>
          ) : null}

        </div>

        <footer className="sticky bottom-0 border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[120px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
          >
            Close
          </button>
        </footer>
      </div>
    </Modal>
  )
}
