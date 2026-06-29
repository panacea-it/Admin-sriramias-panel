import { BookOpen, Loader2, Sparkles } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import CategoryStatusBadge from './CategoryStatusBadge'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { keyFeaturePointsFromSlots } from '../../utils/newDelhiCourseUi'
import { mapWhyChooseFeaturesForWebsite } from '../../utils/whyChooseFeatures'
import {
  normalizeCourseMediaList,
  resolveCourseMediaUrl,
} from '../../utils/courseMediaPrefill'

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

function MediaImage({ src, label }) {
  const url = resolveCourseMediaUrl(src)
  if (!url) return null
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">{label}</p>
      <div className="overflow-hidden rounded-xl border border-[#eef2fc] bg-white p-2">
        <img src={url} alt={label} className="mx-auto max-h-48 w-full object-contain" />
      </div>
    </div>
  )
}

function MediaVideo({ src, label }) {
  const url = resolveCourseMediaUrl(src)
  if (!url) return null
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">{label}</p>
      <div className="overflow-hidden rounded-xl border border-[#eef2fc] bg-[#1a3a5c] p-2">
        <video
          src={url}
          controls
          playsInline
          preload="metadata"
          className="mx-auto max-h-52 w-full rounded-lg object-contain"
        >
          Your browser does not support video playback.
        </video>
      </div>
    </div>
  )
}

function MediaGallery({ images = [], label }) {
  const urls = normalizeCourseMediaList(images)
  if (!urls.length) return null
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">{label}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {urls.map((url) => (
          <div
            key={url}
            className="overflow-hidden rounded-xl border border-[#eef2fc] bg-white p-2"
          >
            <img src={url} alt="" className="mx-auto max-h-40 w-full object-contain" />
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureCardsList({ features = [] }) {
  const cards = mapWhyChooseFeaturesForWebsite({ whyChooseFeatures: features })
  if (!cards.length) return null

  return (
    <div className="space-y-3">
      {cards.map((card, index) => (
        <div
          key={`${card.order ?? index}-${card.title}`}
          className="rounded-xl border border-[#eef2fc] bg-white p-4"
        >
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#246392]">#{card.order ?? index + 1}</span>
            {card.isHighlighted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                <Sparkles className="h-3 w-3" />
                Highlighted
              </span>
            ) : null}
          </div>
          <div className="flex gap-3">
            {card.icon ? (
              <img
                src={resolveCourseMediaUrl(card.icon)}
                alt=""
                className="h-12 w-12 shrink-0 rounded-lg border border-[#eef2fc] object-contain p-1"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#111]">{card.title || '—'}</p>
              {card.description ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-[#444]">{card.description}</p>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function BulletList({ items = [], emptyLabel = '—' }) {
  const points = items.map((entry) => String(entry?.text ?? entry ?? '').trim()).filter(Boolean)
  if (!points.length) return <span>{emptyLabel}</span>
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-[#333]">
      {points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  )
}

export default function ViewCourseManagementModal({ open, onClose, item, loading = false }) {
  if (!open || !item) return null

  const keyFeatureImage = item.keyFeatureImage || item.keyFeatures?.[0]?.preview
  const keyFeaturePoints = keyFeaturePointsFromSlots(item.keyFeatures)
  const featureCards = item.whyChooseFeatures || []
  const helpPoints =
    item.helpSectionPoints ||
    item.newDelhiUi?.howHelpsPoints ||
    item.hyderabadUi?.howHelpsPoints ||
    item.puneUi?.howHelpsPoints ||
    []
  const demoVideo =
    item.demoVideoUrl || item.demoVideo || item.introVideo || item.videoUrl || item.previewVideo
  const whyChooseVideo = item.whyChooseVideo
  const helpSectionVideo = item.helpSectionVideo || item.howWill?.[0]?.preview

  const showKeyFeaturesSection =
    keyFeaturePoints.some((p) => p.text?.trim()) || Boolean(keyFeatureImage)

  const hasMedia =
    (!showKeyFeaturesSection && keyFeatureImage) ||
    demoVideo ||
    whyChooseVideo ||
    helpSectionVideo ||
    item.whyChooseImages?.length ||
    item.helpSectionImages?.length

  return (
    <Modal open={open} onClose={onClose} size="lg" title={`View ${item.name}`} showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader
          title={item.name}
          subtitle={item.courseId}
          onClose={onClose}
          icon={BookOpen}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="bg-[#f0f4f8] p-5 sm:p-6">
          {loading ? (
            <div className="flex min-h-[160px] items-center justify-center gap-2 text-sm text-[#686868]">
              <Loader2 className="h-5 w-5 animate-spin text-[#246392]" />
              Loading course details…
            </div>
          ) : (
            <div className="space-y-5">
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

              {item.overview ? (
                <div className="rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:p-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#246392]">
                    {item.sectionTitleOverview || 'Course Overview'}
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#333]">
                    {item.overview}
                  </p>
                </div>
              ) : null}

              {showKeyFeaturesSection ? (
                <div className="rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:p-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#246392]">
                    {item.sectionTitleKeyFeatures || 'Key Features'}
                  </h3>
                  {keyFeatureImage ? (
                    <div className="mb-4">
                      <MediaImage src={keyFeatureImage} label="Section Image" />
                    </div>
                  ) : null}
                  <BulletList items={keyFeaturePoints} emptyLabel="No key feature points" />
                </div>
              ) : null}

              {featureCards.some((c) => c.title?.trim() || c.description?.trim()) ? (
                <div className="rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:p-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#246392]">
                    {item.whyChooseTitle || item.sectionTitleWhyChoose || 'Why Choose This Course'}
                  </h3>
                  {item.whyChooseSubtitle ? (
                    <p className="mb-4 text-sm text-[#555]">{item.whyChooseSubtitle}</p>
                  ) : null}
                  <FeatureCardsList features={featureCards} />
                </div>
              ) : null}

              {helpPoints.some((p) => String(p?.text ?? p ?? '').trim()) ? (
                <div className="rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:p-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#246392]">
                    {item.sectionTitleHowHelps || 'How This Course Helps You'}
                  </h3>
                  <BulletList items={helpPoints} emptyLabel="No help section points" />
                </div>
              ) : null}

              {hasMedia ? (
                <div className="space-y-4 rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:p-6">
                  <h3 className="border-b border-[#eef2fc] pb-2 text-sm font-bold uppercase tracking-wide text-[#246392]">
                    Media
                  </h3>
                  <div className="grid gap-5">
                    <MediaImage src={keyFeatureImage} label="Key Feature Image" />
                    <MediaVideo src={demoVideo} label="Demo Video" />
                    <MediaGallery images={item.whyChooseImages} label="Why Choose Images" />
                    <MediaVideo src={whyChooseVideo} label="Why Choose Video" />
                    <MediaGallery images={item.helpSectionImages} label="Help Section Images" />
                    <MediaVideo src={helpSectionVideo} label="Help Section Video" />
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <footer className="border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 text-right sm:px-6">
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
