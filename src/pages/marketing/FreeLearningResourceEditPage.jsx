import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import FreeLearningResourcePageHeader from '../../components/website/FreeLearningResourcePageHeader'
import FreeLearningResourceImageField from '../../components/website/FreeLearningResourceImageField'
import { WebsiteField, websiteInputClass } from '../../components/website/websiteUi'
import {
  FREE_LEARNING_RESOURCES_BASE,
  getFreeLearningResourceLabel,
  isValidFreeLearningResourceType,
} from '../../constants/freeLearningResourceConstants'
import {
  fetchFreeLearningResourceByType,
  updateFreeLearningResource,
} from '../../api/freeLearningResourcesAPI'
import {
  buildFreeLearningResourceFormData,
  formFromResource,
  validateFreeLearningResourceForm,
} from '../../utils/freeLearningResourceForm'
import { cn } from '../../utils/cn'
import { toast } from '@/utils/toast'

export default function FreeLearningResourceEditPage() {
  const { resourceType } = useParams()
  const navigate = useNavigate()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(formFromResource(null))
  const [formErrors, setFormErrors] = useState({})

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
        if (!cancelled) {
          setResource(data)
          setForm(formFromResource(data))
          setFormErrors({})
        }
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

  const handleUpdate = async () => {
    const errors = validateFreeLearningResourceForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      await updateFreeLearningResource(decodedType, buildFreeLearningResourceFormData(form))
      toast.success('Resource updated successfully')
      goBack()
    } catch (error) {
      toast.error(error?.message || 'Failed to update resource')
    } finally {
      setSaving(false)
    }
  }

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
      <section className="admin-page-container mx-auto w-full max-w-[min(100%,1000px)] space-y-5">
        <CategoryBreadcrumb
          items={[
            { label: 'Marketing' },
            { label: 'Free Learning Resources', path: FREE_LEARNING_RESOURCES_BASE },
            { label: `Edit ${resourceName}` },
          ]}
        />

        <button
          type="button"
          onClick={goBack}
          disabled={saving}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#246392] hover:underline disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </button>

        <article className="flex max-h-[calc(100vh-10rem)] flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-[0_8px_24px_rgba(7,19,63,0.06)]">
          <FreeLearningResourcePageHeader
            title={resourceName}
            subtitle="Edit Resource"
            onClose={() => !saving && goBack()}
          />

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="rounded-xl border border-[#eef2fc] bg-[#fafcff] px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
                Resource Name
              </p>
              <p className="mt-1 text-sm font-semibold text-[#14213D]">{resourceName}</p>
            </div>

            <WebsiteField label="Heading" required>
              <input
                type="text"
                value={form.heading}
                onChange={(e) => {
                  const value = e.target.value
                  setForm((prev) => ({ ...prev, heading: value }))
                  if (formErrors.heading) {
                    setFormErrors((prev) => {
                      const next = { ...prev }
                      delete next.heading
                      return next
                    })
                  }
                }}
                className={cn(
                  websiteInputClass,
                  'h-10',
                  formErrors.heading && 'ring-2 ring-[#EF4444]/60 bg-red-50/40',
                )}
              />
              {formErrors.heading && (
                <p className="mt-1.5 text-xs font-medium text-[#EF4444]">{formErrors.heading}</p>
              )}
            </WebsiteField>

            <WebsiteField label="Description" required>
              <textarea
                value={form.description}
                rows={4}
                onChange={(e) => {
                  const value = e.target.value
                  setForm((prev) => ({ ...prev, description: value }))
                  if (formErrors.description) {
                    setFormErrors((prev) => {
                      const next = { ...prev }
                      delete next.description
                      return next
                    })
                  }
                }}
                className={cn(
                  'w-full rounded-lg border-0 bg-[#eef6fc] px-4 py-2.5 text-sm text-[#111] outline-none transition focus:ring-2 focus:ring-[#55ace7]/40',
                  formErrors.description && 'ring-2 ring-[#EF4444]/60 bg-red-50/40',
                )}
              />
              {formErrors.description && (
                <p className="mt-1.5 text-xs font-medium text-[#EF4444]">{formErrors.description}</p>
              )}
            </WebsiteField>

            <div>
              <p className="mb-3 text-sm font-semibold text-[#333]">
                Images <span className="text-[#dc2626]">*</span>
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {['image1', 'image2', 'image3'].map((key, index) => (
                  <FreeLearningResourceImageField
                    key={key}
                    id={`edit-${key}`}
                    label={`Image ${index + 1}`}
                    value={form[key].url}
                    file={form[key].file}
                    compact
                    invalid={Boolean(formErrors[key])}
                    onChange={(url) =>
                      setForm((prev) => ({
                        ...prev,
                        [key]: { ...prev[key], url },
                      }))
                    }
                    onFileChange={(file) => {
                      setForm((prev) => ({
                        ...prev,
                        [key]: { url: '', file },
                      }))
                      if (formErrors[key]) {
                        setFormErrors((prev) => {
                          const next = { ...prev }
                          delete next[key]
                          return next
                        })
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 justify-end gap-3 border-t border-[#eef2fc] bg-[#fafcff] px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={goBack}
              disabled={saving}
              className="inline-flex min-h-[40px] min-w-[100px] items-center justify-center rounded-[10px] border border-[#d0d7e2] bg-white px-6 text-sm font-semibold text-[#444] transition hover:bg-[#f8fafc] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={saving}
              className="inline-flex min-h-[40px] min-w-[100px] items-center justify-center rounded-[10px] bg-gradient-to-br from-[#1e4d73] via-[#246392] to-[#0f2d45] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(36,99,146,0.28)] transition hover:brightness-105 disabled:opacity-50"
            >
              {saving ? 'Updating…' : 'Update'}
            </button>
          </div>
        </article>
      </section>
    </div>
  )
}
