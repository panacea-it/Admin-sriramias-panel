import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import FreeLearningResourcePageHeader from '../../components/website/FreeLearningResourcePageHeader'
import {
  QUICK_LINKS_BASE,
  getSidebarSectionLabel,
  isValidSectionKey,
  quickLinksEditPath,
  resolveSectionKeyFromParam,
  SIDEBAR_SECTION_DESCRIPTIONS,
} from '../../constants/quickLinksConstants'
import { fetchHomepageSidebarSectionByKey } from '../../api/homepageSidebarSectionsAPI'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { isResolvableRankerImageUrl } from '../../utils/rankerImageUtils'
import { StatusBadge } from '../../components/academics/AcademicsUi'
import { cn } from '../../utils/cn'
import { toast } from '@/utils/toast'

function DetailBlock({ label, children, className }) {
  return (
    <div className={cn('rounded-xl border border-[#eef2fc] bg-[#fafcff] px-4 py-3.5', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">{label}</p>
      <div className="mt-1.5 text-sm font-medium leading-relaxed text-[#111]">{children}</div>
    </div>
  )
}

function ImageThumbnail({ label, url }) {
  const hasImage = isResolvableRankerImageUrl(url)

  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-semibold text-[#667085]">{label}</p>
      {hasImage ? (
        <div className="overflow-hidden rounded-lg border border-[#E7ECF5] bg-white shadow-sm">
          <img src={url} alt={label} className="h-[120px] w-[200px] max-w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-[120px] w-[200px] max-w-full items-center justify-center rounded-lg border border-dashed border-[#d0d7e2] bg-[#f8fafc] text-xs text-[#9ca3af]">
          No image
        </div>
      )}
    </div>
  )
}

export default function QuickLinksSectionViewPage() {
  const { sectionSlug } = useParams()
  const navigate = useNavigate()
  const [section, setSection] = useState(null)
  const [loading, setLoading] = useState(true)

  const decodedKey = resolveSectionKeyFromParam(sectionSlug)
  const sectionName = getSidebarSectionLabel(decodedKey)

  const goBack = () => navigate(QUICK_LINKS_BASE)

  useEffect(() => {
    if (!isValidSectionKey(decodedKey)) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchHomepageSidebarSectionByKey(decodedKey)
        if (!cancelled) setSection(data)
      } catch (error) {
        if (!cancelled) {
          toast.error(error?.message || 'Failed to load section')
          setSection(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [decodedKey])

  if (!isValidSectionKey(decodedKey)) {
    return <Navigate to={QUICK_LINKS_BASE} replace />
  }

  if (loading) {
    return (
      <div className="figma-admin-section min-h-screen animate-pulse bg-[#f7f7f7] px-4 py-8 sm:px-5 lg:px-6">
        <div className="mx-auto h-96 max-w-[1000px] rounded-xl bg-white" />
      </div>
    )
  }

  if (!section) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center sm:px-5 lg:px-6">
        <p className="text-[#686868]">Section not found.</p>
        <Link
          to={QUICK_LINKS_BASE}
          className="mt-4 inline-block text-sm font-semibold text-[#246392] hover:underline"
        >
          Back to Quick Links
        </Link>
      </div>
    )
  }

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="admin-page-container mx-auto w-full max-w-[min(100%,1000px)] space-y-5">
        <CategoryBreadcrumb
          items={[
            { label: 'Marketing' },
            { label: 'Quick Links' },
            { label: sectionName },
          ]}
        />

        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#246392] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </button>

        <article className="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-[0_8px_24px_rgba(7,19,63,0.06)]">
          <FreeLearningResourcePageHeader
            title={sectionName}
            subtitle="View Sidebar Section"
            onClose={goBack}
          />

          <div className="flex justify-end border-b border-[#eef2fc] px-5 py-3 sm:px-6">
            <Link
              to={quickLinksEditPath(decodedKey)}
              className="text-sm font-semibold text-[#246392] hover:underline"
            >
              Edit section
            </Link>
          </div>

          <div className="space-y-5 px-5 py-5 sm:px-6">
            <p className="text-sm text-[#667085]">
              {SIDEBAR_SECTION_DESCRIPTIONS[decodedKey] || '—'}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <DetailBlock label="Heading">{section.heading || '—'}</DetailBlock>
              <DetailBlock label="Status">
                <StatusBadge status={section.isActive !== false ? 'Active' : 'Deactivated'} />
              </DetailBlock>
              {section.ctaLabel && <DetailBlock label="CTA Label">{section.ctaLabel}</DetailBlock>}
              {section.ctaHref && <DetailBlock label="CTA Link">{section.ctaHref}</DetailBlock>}
              {section.viewAllHref && (
                <DetailBlock label="View All Link">{section.viewAllHref}</DetailBlock>
              )}
              <DetailBlock label="Last Updated">
                {section.updatedAt ? formatCategoryDateTime(section.updatedAt) : '—'}
              </DetailBlock>
            </div>

            {decodedKey === 'DAILY_QUIZ' && (
              <>
                <DetailBlock label="Quiz Question">{section.quizQuestion || '—'}</DetailBlock>
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#14213D]">Quiz Options</p>
                  {(section.quizOptions || []).map((option, index) => (
                    <div
                      key={`view-option-${index}`}
                      className="rounded-xl border border-[#eef2fc] bg-[#fafcff] px-4 py-3"
                    >
                      <p className="text-sm font-medium text-[#111]">{option.label || '—'}</p>
                      <p className="mt-1 text-xs text-[#667085]">
                        Sort: {option.sortOrder ?? index + 1} ·{' '}
                        {option.isActive !== false ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {decodedKey !== 'DAILY_QUIZ' && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[#14213D]">Items</p>
                {(section.items || []).map((item, index) => (
                  <div
                    key={`view-item-${index}`}
                    className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4"
                  >
                    <p className="text-sm font-semibold text-[#14213D]">{item.title || '—'}</p>
                    <div className="mt-2 grid gap-2 text-xs text-[#667085] sm:grid-cols-2">
                      {decodedKey === 'QUICK_LINKS' && item.href && <p>Link: {item.href}</p>}
                      {decodedKey === 'TRENDING_VIDEOS' && item.href && (
                        <p>YouTube: {item.href}</p>
                      )}
                      {item.slug && <p>Slug: {item.slug}</p>}
                      {item.icon && <p>Icon: {item.icon}</p>}
                      <p>Sort: {item.sortOrder ?? index + 1}</p>
                      <p>{item.isActive !== false ? 'Active' : 'Inactive'}</p>
                    </div>
                    {item.imageUrl && decodedKey !== 'TRENDING_VIDEOS' && (
                      <div className="mt-3">
                        <ImageThumbnail label="Preview" url={item.imageUrl} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
