import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, GraduationCap, Loader2 } from 'lucide-react'
import CategoryBreadcrumb from '../../components/categories/CategoryBreadcrumb'
import RankerFormFields, { emptyRankForm } from '../../components/website/RankerFormFields'
import {
  isActiveTop10Ranker,
} from '../../components/website/rankManagementDisplay'
import {
  buildTopperFormData,
  formFromApiTopper,
  mapApiToppersToRankerRows,
  prepareTopperImageForUpload,
} from '../../utils/topperApiHelpers'
import { validateRankerForm } from '../../utils/rankFormValidation'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  MAX_TOP10_RANKERS,
  RANK_MANAGEMENT_BASE,
} from '../../constants/rankManagementConstants'
import { useTopper, useToppers, useUpdateTopper } from '../../hooks/useToppers'
import { toast } from '@/utils/toast'

export default function EditTopperPage() {
  const { id: topperId = '' } = useParams()
  const navigate = useNavigate()
  const decodedId = decodeURIComponent(topperId)

  const {
    data: topper,
    isLoading,
    isError,
    error,
    refetch,
  } = useTopper(decodedId)

  const { data: allToppers = [] } = useToppers()
  const updateTopperMutation = useUpdateTopper()

  const [form, setForm] = useState(emptyRankForm)
  const [formErrors, setFormErrors] = useState({})

  const rankers = useMemo(() => mapApiToppersToRankerRows(allToppers), [allToppers])
  const top10Count = useMemo(
    () => rankers.filter((row) => isActiveTop10Ranker(row)).length,
    [rankers],
  )
  const top10LimitReached = top10Count >= MAX_TOP10_RANKERS
  const existingRow = useMemo(
    () => rankers.find((row) => row.id === decodedId),
    [rankers, decodedId],
  )
  const wasTop10 = Boolean(existingRow?.isTop10) && existingRow?.status === 'Active'

  const goBack = () => navigate(RANK_MANAGEMENT_BASE)

  useEffect(() => {
    setForm(emptyRankForm())
    setFormErrors({})
  }, [decodedId])

  useEffect(() => {
    if (!topper) return

    const topperId = String(topper._id || '')
    if (topperId !== decodedId) return

    setForm(formFromApiTopper(topper))
    setFormErrors({})
  }, [topper, decodedId])

  const clearFieldError = (field) => {
    if (!formErrors[field]) return
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleUpdate = async () => {
    const errors = validateRankerForm(form, {
      editingId: decodedId,
      rankers,
    })

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error('Please fix the highlighted fields')
      return
    }

    const wantsTop10 = form.status === 'Active' && form.isTop10
    if (wantsTop10 && !wasTop10 && top10LimitReached) {
      toast.error('Maximum 10 Top Rankers allowed.')
      return
    }

    const imageFile = await prepareTopperImageForUpload(form.image)
    const formData = buildTopperFormData(form, {
      imageFile,
      includeImage: Boolean(imageFile),
    })

    try {
      const response = await updateTopperMutation.mutateAsync({
        id: decodedId,
        formData,
      })
      toast.success(response?.message || 'Topper updated successfully')
      goBack()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update topper'))
    }
  }

  if (!decodedId.trim()) {
    return <Navigate to={RANK_MANAGEMENT_BASE} replace />
  }

  if (isLoading) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center sm:px-5 lg:px-6">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#55ace7]" />
        <p className="mt-4 text-sm text-[#686868]">Loading topper details…</p>
      </div>
    )
  }

  if (isError) {
    const message = getApiErrorMessage(error, 'Failed to load topper')
    const isNotFound = error?.response?.status === 404

    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center sm:px-5 lg:px-6">
        <p className="text-[#686868]">{isNotFound ? 'Topper not found.' : message}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {!isNotFound ? (
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm font-semibold text-[#246392] hover:underline"
            >
              Retry
            </button>
          ) : null}
          <Link
            to={RANK_MANAGEMENT_BASE}
            className="text-sm font-semibold text-[#246392] hover:underline"
          >
            Back to Rank Management
          </Link>
        </div>
      </div>
    )
  }

  if (!topper) {
    return <Navigate to={RANK_MANAGEMENT_BASE} replace />
  }

  const saving = updateTopperMutation.isPending
  const displayName = form.studentName || topper.studentName || 'Topper'

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="admin-page-container mx-auto w-full max-w-[min(100%,1000px)] space-y-5">
        <CategoryBreadcrumb
          items={[
            { label: 'Marketing' },
            { label: 'Rank Management', path: RANK_MANAGEMENT_BASE },
            { label: `Edit ${displayName}` },
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
          <header className="flex min-h-[56px] shrink-0 items-center gap-3 bg-gradient-to-r from-[#55ace7] via-[#4a9fd8] to-[#1a4d73] px-5 py-3.5 sm:px-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <GraduationCap className="h-5 w-5 text-[#246392]" strokeWidth={2.4} />
            </span>
            <div>
              <h1 className="text-lg font-bold leading-tight text-white sm:text-xl">
                Edit Topper
              </h1>
              <p className="text-sm text-white/85">{displayName}</p>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <RankerFormFields
              form={form}
              setForm={setForm}
              formErrors={formErrors}
              clearFieldError={clearFieldError}
              top10LimitReached={top10LimitReached}
              wasTop10={wasTop10}
              rankers={rankers}
            />
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
              className="inline-flex min-h-[40px] min-w-[120px] items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-[#1e4d73] via-[#246392] to-[#0f2d45] px-6 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(36,99,146,0.28)] transition hover:brightness-105 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                'Update'
              )}
            </button>
          </div>
        </article>
      </section>
    </div>
  )
}
