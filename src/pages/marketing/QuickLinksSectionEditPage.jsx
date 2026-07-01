import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import FreeLearningResourcePageHeader from '../../components/website/FreeLearningResourcePageHeader'
import QuickLinksSectionItemEditor, {
  QuickLinksSaveBar,
  QuickLinksToggleField,
} from '../../components/website/QuickLinksSectionItemEditor'
import { WebsiteField, websiteInputClass } from '../../components/website/websiteUi'
import {
  QUICK_LINKS_BASE,
  getSidebarSectionLabel,
  isValidSectionKey,
  resolveSectionKeyFromParam,
  SIDEBAR_SECTION_DESCRIPTIONS,
} from '../../constants/quickLinksConstants'
import {
  fetchHomepageSidebarSectionByKey,
  updateHomepageSidebarSection,
} from '../../api/homepageSidebarSectionsAPI'
import {
  buildSectionFormData,
  formFromSection,
  validateSectionForm,
} from '../../utils/homepageSidebarSectionForm'
import { toast } from '@/utils/toast'

export default function QuickLinksSectionEditPage() {
  const { sectionSlug } = useParams()
  const navigate = useNavigate()
  const [section, setSection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(formFromSection(null))
  const [formErrors, setFormErrors] = useState({})

  const decodedKey = resolveSectionKeyFromParam(sectionSlug)
  const sectionName = getSidebarSectionLabel(decodedKey)
  const description = SIDEBAR_SECTION_DESCRIPTIONS[decodedKey] || ''

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
        if (!cancelled) {
          setSection(data)
          setForm(formFromSection(data, decodedKey))
          setFormErrors({})
        }
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

  const handleUpdate = async () => {
    const errors = validateSectionForm(decodedKey, form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const payload = buildSectionFormData(decodedKey, form)
      const updated = await updateHomepageSidebarSection(decodedKey, payload)
      setSection(updated)
      setForm(formFromSection(updated, decodedKey))
      toast.success('Section updated successfully')
    } catch (error) {
      toast.error(error?.message || 'Failed to update section')
    } finally {
      setSaving(false)
    }
  }

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

  const showCta = ['OUR_BOOKS', 'DAILY_LEARNING', 'DAILY_QUIZ', 'COURSES'].includes(decodedKey)
  const showViewAll = decodedKey === 'TRENDING_VIDEOS'
  const showQuizQuestion = decodedKey === 'DAILY_QUIZ'

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="admin-page-container mx-auto w-full max-w-[min(100%,1000px)] space-y-5">
        <CategoryBreadcrumb
          items={[
            { label: 'Marketing' },
            { label: 'Quick Links' },
            { label: `Edit ${sectionName}` },
          ]}
        />

        <button
          type="button"
          onClick={goBack}
          disabled={saving}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#246392] hover:underline disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Our Books
        </button>

        <article className="flex max-h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-[0_8px_24px_rgba(7,19,63,0.06)]">
          <FreeLearningResourcePageHeader
            title={sectionName}
            subtitle="Edit Sidebar Section"
            onClose={() => !saving && goBack()}
          />

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="rounded-xl border border-[#eef2fc] bg-[#fafcff] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                Section
              </p>
              <p className="mt-1 text-sm font-semibold text-[#14213D]">{sectionName}</p>
              {description && <p className="mt-1 text-xs text-[#667085]">{description}</p>}
            </div>

            <WebsiteField label="Heading" required>
              <input
                type="text"
                value={form.heading}
                onChange={(event) => setForm((prev) => ({ ...prev, heading: event.target.value }))}
                className={websiteInputClass}
              />
              {formErrors.heading && (
                <p className="mt-1 text-xs text-[#dc2626]">{formErrors.heading}</p>
              )}
            </WebsiteField>

            <QuickLinksToggleField
              label="Section is active on student panel"
              checked={form.isActive}
              onChange={(isActive) => setForm((prev) => ({ ...prev, isActive }))}
            />

            {showCta && (
              <div className="grid gap-4 sm:grid-cols-2">
                <WebsiteField label="CTA Label">
                  <input
                    type="text"
                    value={form.ctaLabel}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, ctaLabel: event.target.value }))
                    }
                    className={websiteInputClass}
                    placeholder="Explore"
                  />
                </WebsiteField>
                <WebsiteField label="CTA Link">
                  <input
                    type="text"
                    value={form.ctaHref}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, ctaHref: event.target.value }))
                    }
                    className={websiteInputClass}
                    placeholder="/books"
                  />
                </WebsiteField>
              </div>
            )}

            {showViewAll && (
              <WebsiteField label="View All Link">
                <input
                  type="text"
                  value={form.viewAllHref}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, viewAllHref: event.target.value }))
                  }
                  className={websiteInputClass}
                  placeholder="https://www.youtube.com/@SriramsIAS"
                />
              </WebsiteField>
            )}

            {showQuizQuestion && (
              <WebsiteField label="Quiz Question" required>
                <textarea
                  value={form.quizQuestion}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, quizQuestion: event.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-lg border-0 bg-[#eef6fc] px-4 py-3 text-sm text-[#111] outline-none transition focus:ring-2 focus:ring-[#55ace7]/40"
                />
                {formErrors.quizQuestion && (
                  <p className="mt-1 text-xs text-[#dc2626]">{formErrors.quizQuestion}</p>
                )}
              </WebsiteField>
            )}

            <QuickLinksSectionItemEditor
              sectionKey={decodedKey}
              items={form.items}
              quizOptions={form.quizOptions}
              onItemsChange={(items) => setForm((prev) => ({ ...prev, items }))}
              onQuizOptionsChange={(quizOptions) =>
                setForm((prev) => ({ ...prev, quizOptions }))
              }
              error={formErrors.items || formErrors.quizOptions}
              itemErrors={formErrors}
            />
          </div>

          <QuickLinksSaveBar saving={saving} onCancel={goBack} onSave={handleUpdate} />
        </article>
      </section>
    </div>
  )
}
