import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import FreeLearningResourcePageHeader from '../../components/website/FreeLearningResourcePageHeader'
import FreeLearningResourceImagePreviewModal from '../../components/website/FreeLearningResourceImagePreviewModal'
import {
  FREE_LEARNING_RESOURCES_BASE,
  getFreeLearningResourceLabel,
  isValidFreeLearningResourceType,
} from '../../constants/freeLearningResourceConstants'
import { fetchFreeLearningResourceByType } from '../../api/freeLearningResourcesAPI'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { isResolvableRankerImageUrl } from '../../utils/rankerImageUtils'
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

function ImageThumbnail({ label, url, onPreview }) {
  const hasImage = isResolvableRankerImageUrl(url)

  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-semibold text-[#667085]">{label}</p>
      {hasImage ? (
        <button
          type="button"
          onClick={() => onPreview(url, label)}
          className="block overflow-hidden rounded-lg border border-[#E7ECF5] bg-white shadow-sm transition hover:ring-2 hover:ring-[#55ace7]/40"
        >
          <img src={url} alt={label} className="h-[120px] w-[200px] max-w-full object-cover" />
        </button>
      ) : (
        <div className="flex h-[120px] w-[200px] max-w-full items-center justify-center rounded-lg border border-dashed border-[#d0d7e2] bg-[#f8fafc] text-xs text-[#9ca3af]">
          No image
        </div>
      )}
    </div>
  )
}

export default function FreeLearningResourceViewPage() {
  const { resourceType } = useParams()
  const navigate = useNavigate()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState({ open: false, src: '', alt: '' })

  const decodedType = decodeURIComponent(resourceType || '')
  const resourceName = getFreeLearningResourceLabel(decodedType)

  const goBack = () => navigate(FREE_LEARNING_RESOURCES_BASE)

  useEffect(() => {
    if (!isValidFreeLearningResourceType(decodedType)) {
      setLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await fetchFreeLearningResourceByType(decodedType)
        if (!cancelled) setResource(data)
      } catch (error) {
        if (!cancelled) {
          toast.error(error?.message || 'Failed to load resource')
          setResource(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [decodedType])

  if (!isValidFreeLearningResourceType(decodedType)) {
    return <Navigate to={FREE_LEARNING_RESOURCES_BASE} replace />
  }

  if (loading) {
    return (
      <div className="figma-admin-section min-h-screen animate-pulse bg-[#f7f7f7] px-4 py-8 sm:px-5 lg:px-6">
        <div className="mx-auto max-w-[1000px] h-96 rounded-xl bg-white" />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center sm:px-5 lg:px-6">
        <p className="text-[#686868]">Resource not found.</p>
        <Link
          to={FREE_LEARNING_RESOURCES_BASE}
          className="mt-4 inline-block text-sm font-semibold text-[#246392] hover:underline"
        >
          Back to Free Learning Resources
        </Link>
      </div>
    )
  }

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-[1000px] space-y-5">
        <CategoryBreadcrumb
          items={[
            { label: 'Marketing' },
            { label: 'Free Learning Resources', path: FREE_LEARNING_RESOURCES_BASE },
            { label: resourceName },
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

        <article className="flex max-h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-[0_8px_24px_rgba(7,19,63,0.06)]">
          <FreeLearningResourcePageHeader
            title={resourceName}
            subtitle="Free Learning Resource"
            onClose={goBack}
          />

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-6 sm:px-6">
            <DetailBlock label="Heading">{resource.heading?.trim() || '—'}</DetailBlock>

            <DetailBlock label="Description">
              <p className="whitespace-pre-wrap font-normal text-[#444]">
                {resource.description?.trim() || '—'}
              </p>
            </DetailBlock>

            <div className="rounded-xl border border-[#eef2fc] bg-white px-4 py-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                Images
              </p>
              <div className="flex flex-wrap gap-4">
                <ImageThumbnail
                  label="Image 1"
                  url={resource.image1?.url}
                  onPreview={(src, alt) => setPreview({ open: true, src, alt })}
                />
                <ImageThumbnail
                  label="Image 2"
                  url={resource.image2?.url}
                  onPreview={(src, alt) => setPreview({ open: true, src, alt })}
                />
                <ImageThumbnail
                  label="Image 3"
                  url={resource.image3?.url}
                  onPreview={(src, alt) => setPreview({ open: true, src, alt })}
                />
              </div>
            </div>

            <DetailBlock label="Last Updated">
              {resource.updatedAt ? formatCategoryDateTime(resource.updatedAt) : '—'}
            </DetailBlock>
          </div>

          <div className="flex shrink-0 justify-end border-t border-[#eef2fc] bg-[#fafcff] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={goBack}
              className="inline-flex min-h-[42px] min-w-[120px] items-center justify-center rounded-[10px] bg-gradient-to-br from-[#1e4d73] via-[#246392] to-[#0f2d45] px-8 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(36,99,146,0.28)] transition hover:brightness-105"
            >
              Close
            </button>
          </div>
        </article>
      </section>

      <FreeLearningResourceImagePreviewModal
        open={preview.open}
        src={preview.src}
        alt={preview.alt}
        onClose={() => setPreview({ open: false, src: '', alt: '' })}
      />
    </div>
  )
}
