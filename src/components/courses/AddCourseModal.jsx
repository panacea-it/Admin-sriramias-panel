import { useEffect, useState, useCallback } from 'react'
import { fetchBatchByIdResolved } from '../../api/batchesAPI'
import { BookOpen, Copy, CreditCard, GraduationCap } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from './ModalPanelHeader'
import BatchDetailsSection from './BatchDetailsSection'
import BatchFeeDetailsSection from './BatchFeeDetailsSection'
import BatchSubjectDetailsSection from './BatchSubjectDetailsSection'
import BatchFormCard from './batch-form/BatchFormCard'
import BatchFormStickyFooter from './batch-form/BatchFormStickyFooter'
import {
  batchRowToDuplicateForm,
  batchRowToForm,
  createEmptyBatchForm,
  validateBatchFee,
} from '../../utils/batchFormMappers'
import { normalizeLinkedSubjects } from '../../utils/batchHelpers'
import {
  isBatchCodeTaken,
  isBatchIdTaken,
  isBatchNameTaken,
} from '../../utils/batchOperations'
import { useModalForm } from '../../hooks/useModalForm'
import { cn } from '../../utils/cn'

/** Batch create/edit only — course marketing content lives in Categories → Courses */
export default function AddCourseModal({
  open,
  onClose,
  item,
  duplicateSource = null,
  existingBatches = [],
  onSubmit,
}) {
  const isDuplicateMode = Boolean(duplicateSource)
  const modalRecord = isDuplicateMode ? duplicateSource : item

  const mapRowToForm = useCallback(
    (row) => (isDuplicateMode && row ? batchRowToDuplicateForm(row) : batchRowToForm(row)),
    [isDuplicateMode],
  )

  const { form, setForm, isEditMode, reset } = useModalForm(
    open,
    modalRecord,
    mapRowToForm,
    createEmptyBatchForm,
    { forceCreateMode: isDuplicateMode },
  )
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [brochureUploading, setBrochureUploading] = useState(false)
  const [demoVideoUploading, setDemoVideoUploading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  const excludeId = isEditMode ? item?.id : null

  useEffect(() => {
    if (open) {
      setErrors({})
      setBrochureUploading(false)
      setDemoVideoUploading(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    // Only edit mode needs a detail fetch — create/duplicate use list-row prefill.
    const batchId = isEditMode ? item?.id : null
    if (!batchId) return undefined

    const ac = new AbortController()
    let active = true
    setDetailLoading(true)
    fetchBatchByIdResolved(batchId, { rows: existingBatches, signal: ac.signal })
      .then((row) => {
        if (!active || !row) return
        setForm(mapRowToForm(row))
      })
      .catch((err) => {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        /* keep list row prefill */
      })
      .finally(() => {
        if (active) setDetailLoading(false)
      })

    return () => {
      active = false
      ac.abort()
    }
  }, [open, isEditMode, item?.id, mapRowToForm, setForm, existingBatches])

  const handleClose = () => onClose()

  const validateBatch = () => {
    const next = {}
    if (!form.batchName?.trim()) next.batchName = 'Batch name is required'
    if (!form.batchCode?.trim()) next.batchCode = 'Batch code is required'
    if (!form.mentorId?.trim() && !form.mentorEmail?.trim()) {
      next.mentorEmail = 'Mentor is required'
    }
    if (!form.academicCourseId?.trim() && !form.courseId?.trim()) {
      next.courseId = 'Please select a course'
    }
    if (!form.commencement) next.commencement = 'Date of commencement is required'
    if (!form.durationLabel?.trim()) next.durationLabel = 'Duration is required'
    if (!form.batchStartFrom) next.batchStartFrom = 'Batch start date is required'
    if (!form.batchEndTo) next.batchEndTo = 'Batch end date is required'
    else if (form.batchStartFrom && form.batchEndTo < form.batchStartFrom) {
      next.batchEndTo = 'End date cannot be before start date'
    }
    if (!form.status?.trim()) next.status = 'Status is required'
    if (!form.bannerPreview && !form.bannerFileName && !form.bannerFile) {
      next.bannerPreview = 'Banner image is required'
    }
    if (!form.brochureUrl && !form.brochureFileName && !form.brochureFile) {
      next.brochureUrl = 'Batch brochure is required'
    }
    if (!normalizeLinkedSubjects(form).length) {
      next.linkedSubjects = 'Please select at least one subject'
    }
    Object.assign(next, validateBatchFee(form))

    if (form.batchName?.trim() && isBatchNameTaken(form.batchName, existingBatches, excludeId)) {
      next.batchName = 'This Batch Name already exists.'
    }
    if (form.batchCode?.trim() && isBatchCodeTaken(form.batchCode, existingBatches, excludeId)) {
      next.batchCode = 'This Batch Code already exists.'
    }
    if (
      !isEditMode &&
      !isDuplicateMode &&
      form.batchId?.trim() &&
      isBatchIdTaken(form.batchId, existingBatches, excludeId)
    ) {
      next.batchId = 'This Batch ID already exists.'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (brochureUploading) {
      toast.error('Please wait for the brochure upload to finish')
      return
    }
    if (demoVideoUploading) {
      toast.error('Please wait for the demo video upload to finish')
      return
    }
    if (!validateBatch()) {
      toast.error('Please fix the highlighted fields')
      return
    }
    setSubmitting(true)
    try {
      await onSubmit?.(form, {
        isEdit: isEditMode,
        id: item?.id,
        isDuplicate: isDuplicateMode,
        duplicateFromId: duplicateSource?.id,
      })
      if (isDuplicateMode) {
        toast.success('Batch Duplicated Successfully')
      } else {
        toast.success(
          isEditMode ? 'Batch updated successfully' : 'Batch Created Successfully',
        )
      }
      handleClose()
    } catch (err) {
      if (import.meta.env.DEV && err?.debugDetail) {
        console.error('[batches] save failed', err.debugDetail)
      }
      toast.error(err.message || 'Failed to save batch')
    } finally {
      setSubmitting(false)
    }
  }

  const modalTitle = isEditMode
    ? 'Edit Batch'
    : isDuplicateMode
      ? 'Duplicate Batch'
      : 'Add Batch'

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="full"
      title={modalTitle}
      showCloseButton={false}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[min(92vh,860px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader title={modalTitle} onClose={handleClose} closeVariant="icon" />

        {isDuplicateMode && (
          <div
            className={cn(
              'mx-4 mt-4 flex items-start gap-3 rounded-xl border border-[#55ace7]/25 bg-[#eef6fc] px-4 py-3 sm:mx-8',
            )}
          >
            <Copy className="mt-0.5 h-4 w-4 shrink-0 text-[#246392]" />
            <div>
              <p className="text-sm font-semibold text-[#1a3a5c]">Duplicating batch</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#686868]">
                Values are pre-filled from the source batch. Update the batch name and assign a
                unique batch code before saving. A new batch ID will be generated automatically.
              </p>
            </div>
          </div>
        )}

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#c5d9eb_transparent]"
        >
          <div className="space-y-6 px-4 py-6 sm:space-y-8 sm:px-8 sm:py-8">
            <BatchFormCard
              step={1}
              icon={BookOpen}
              title="Batch Details"
              description="Name, course, schedule dates, banner image, brochure, and demo video for this batch."
            >
              <BatchDetailsSection
                form={form}
                setForm={setForm}
                errors={errors}
                setErrors={setErrors}
                onBrochureUploadingChange={setBrochureUploading}
                onDemoVideoUploadingChange={setDemoVideoUploading}
                excludeCourseIds={[]}
                isEditMode={isEditMode}
              />
            </BatchFormCard>

            <BatchFormCard
              step={2}
              icon={CreditCard}
              title="Fee Details"
              description="Payment amounts, currency, and bullet points shown to students."
            >
              <BatchFeeDetailsSection form={form} setForm={setForm} errors={errors} />
            </BatchFormCard>

            <BatchFormCard
              step={3}
              icon={GraduationCap}
              title="Subject Details"
              description="Link faculty subjects from Academics to this batch for scheduling."
              required
            >
              <BatchSubjectDetailsSection
                form={form}
                setForm={setForm}
                errors={errors}
                setErrors={setErrors}
              />
            </BatchFormCard>
          </div>
        </div>

        <BatchFormStickyFooter
          isEditMode={isEditMode}
          saving={submitting || brochureUploading || demoVideoUploading || detailLoading}
          onReset={() => {
            reset()
            setErrors({})
            toast.message('Form reset')
          }}
          createLabel={isDuplicateMode ? 'Create Duplicate' : 'Create'}
          updateLabel="Update"
        />
      </form>
    </Modal>
  )
}
