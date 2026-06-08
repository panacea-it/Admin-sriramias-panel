import { BookOpen, X } from 'lucide-react'
import Modal from '../ui/Modal'
import CategoryStatusBadge from './CategoryStatusBadge'
import SectionBar from '../courses/SectionBar'
import BatchFormSection from '../courses/BatchFormSection'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import {
  academicCourseItemToContent,
  getCourseMarketingSectionTitles,
} from '../../utils/academicCourseForm'
import { normalizeWhyChooseFeatures } from '../../utils/whyChooseFeatures'

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

function ReadOnlyBlock({ title, children }) {
  if (!children) return null
  return (
    <div className="space-y-6">
      <SectionBar title={title} />
      <BatchFormSection>{children}</BatchFormSection>
    </div>
  )
}

export default function ViewCourseManagementModal({ open, onClose, item }) {
  if (!open || !item) return null

  const content = academicCourseItemToContent(item)
  const sectionTitles = getCourseMarketingSectionTitles(item)
  const whyFeatures = normalizeWhyChooseFeatures({
    whyChooseFeatures: content.whyChooseFeatures,
    whyChooseCourse: item.whyChooseCourse,
  })
  const keySlots = content.keyFeatures || []
  const textFeatures = keySlots.slice(1).map((s) => s.text).filter(Boolean)
  const howSlots = (content.howWill || []).filter((s) => s.fileName || s.preview)

  return (
    <Modal open={open} onClose={onClose} size="full" title={`View ${item.name}`}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#55ace7] via-[#5a7ba8] to-[#1a3a5c] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <BookOpen className="h-6 w-6 text-[#246392]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 text-white">
              <h2 className="truncate text-lg font-bold sm:text-xl">{item.name}</h2>
              <p className="text-sm text-white/85">{item.courseId}</p>
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

        <div className="max-h-[70vh] space-y-6 overflow-y-auto bg-[#f0f4f8] p-5 sm:p-6">
          <div className="rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:p-6">
            <h3 className="mb-4 border-b border-[#eef2fc] pb-2 text-sm font-bold uppercase tracking-wide text-[#246392]">
              Course Details
            </h3>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Course ID">{item.courseId || '—'}</DetailItem>
              <DetailItem label="Course Name">{item.name}</DetailItem>
              <DetailItem label="Centre">{item.centerName || '—'}</DetailItem>
              <DetailItem label="Program">{item.program || '—'}</DetailItem>
              <DetailItem label="Exam Category">{item.examCategory || '—'}</DetailItem>
              <DetailItem label="Exam Subcategory">{item.examSubCategory || '—'}</DetailItem>
              <DetailItem label="Status">
                <CategoryStatusBadge status={item.status} />
              </DetailItem>
              <DetailItem label="Created On">
                {formatCategoryDateTime(item.createdAt)}
              </DetailItem>
              <DetailItem label="Modified On">
                {formatCategoryDateTime(item.modifiedAt)}
              </DetailItem>
            </dl>
          </div>

          {content.overview ? (
            <ReadOnlyBlock title={sectionTitles.overview}>
              <p className="whitespace-pre-wrap text-sm text-[#444]">{content.overview}</p>
            </ReadOnlyBlock>
          ) : null}

          {(keySlots[0]?.fileName || textFeatures.length > 0) && (
            <ReadOnlyBlock title={sectionTitles.keyFeatures}>
              <div className="space-y-3 text-sm text-[#444]">
                {keySlots[0]?.fileName ? (
                  <p>
                    <span className="font-semibold text-[#246392]">Hero image:</span>{' '}
                    {keySlots[0].fileName}
                  </p>
                ) : null}
                {textFeatures.length ? (
                  <ul className="list-disc space-y-1 pl-5">
                    {textFeatures.map((f, i) => (
                      <li key={`${f}-${i}`}>{f}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </ReadOnlyBlock>
          )}

          {whyFeatures.some((f) => f.title || f.description) ? (
            <ReadOnlyBlock title={sectionTitles.whyChoose}>
              {sectionTitles.whyChooseSubtitle ? (
                <p className="mb-4 text-center text-sm text-[#555]">
                  {sectionTitles.whyChooseSubtitle}
                </p>
              ) : null}
              <div className="grid gap-4 md:grid-cols-2">
                {whyFeatures.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-gray-100 bg-[#fafcff] p-4 text-sm"
                  >
                    {f.iconPreview || f.icon ? (
                      <img
                        src={f.iconPreview || f.icon}
                        alt=""
                        className="mb-3 h-12 w-12 object-contain"
                      />
                    ) : null}
                    {f.title ? <p className="font-semibold text-[#111]">{f.title}</p> : null}
                    {f.description ? (
                      <p className="mt-1 whitespace-pre-wrap text-[#444]">{f.description}</p>
                    ) : null}
                    {f.isHighlighted ? (
                      <p className="mt-2 text-xs font-semibold text-amber-700">Highlighted</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </ReadOnlyBlock>
          ) : null}

          {howSlots.length ? (
            <ReadOnlyBlock title={sectionTitles.howHelps}>
              <ul className="space-y-2 text-sm text-[#444]">
                {howSlots.map((slot) => (
                  <li key={slot.id}>
                    <span className="font-semibold capitalize text-[#246392]">
                      {slot.kind || 'image'}:
                    </span>{' '}
                    {slot.fileName || slot.preview || '—'}
                  </li>
                ))}
              </ul>
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
