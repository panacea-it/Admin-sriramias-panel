import { useEffect, useState } from 'react'
import { BookOpen, CreditCard, GraduationCap } from 'lucide-react'
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
import { useModalForm } from '../../hooks/useModalForm'
/** Batch create/edit only — course marketing content lives in Categories → Courses */
export default function AddCourseModal({
  open,
  onClose,
  item,
  duplicateSource = null,
  onSubmit,
  existingCourseIds = [],
}) {
  const isDuplicateMode = Boolean(duplicateSource)
  const modalRecord = isDuplicateMode ? duplicateSource : item

  const mapRowToForm = (row) =>
    isDuplicateMode && row ? batchRowToDuplicateForm(row) : batchRowToForm(row)

  const { form, setForm, isEditMode, reset } = useModalForm(
    open,
    modalRecord,
    mapRowToForm,
    createEmptyBatchForm,
    { forceCreateMode: isDuplicateMode },
  )
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setErrors({})
  }, [open])

  const handleClose = () => onClose()

  const validateBatch = () => {
    const next = {}
    if (!form.batchName?.trim()) next.batchName = 'Batch name is required'
    if (!form.mentorEmail?.trim()) next.mentorEmail = 'Mentor is required'
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
    if (!form.bannerPreview && !form.bannerFileName) {
      next.bannerPreview = 'Banner image is required'
    }
    Object.assign(next, validateBatchFee(form))
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
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
        toast.success('Batch duplicated successfully')
      } else {
        toast.success(isEditMode ? 'Batch updated successfully' : 'Batch created successfully')
      }
      handleClose()
    } catch (err) {
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

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin] [scrollbar-color:#c5d9eb_transparent]"
        >
          <div className="space-y-6 px-4 py-6 sm:space-y-8 sm:px-8 sm:py-8">
            <BatchFormCard
              step={1}
              icon={BookOpen}
              title="Batch Details"
              description="Name, course, schedule dates, and banner image for this batch."
            >
              <BatchDetailsSection
                form={form}
                setForm={setForm}
                errors={errors}
                setErrors={setErrors}
                excludeCourseIds={
                  isEditMode || isDuplicateMode ? [] : existingCourseIds
                }
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
            >
              <BatchSubjectDetailsSection form={form} setForm={setForm} />
            </BatchFormCard>
          </div>
        </div>

        <BatchFormStickyFooter
          isEditMode={isEditMode}
          saving={submitting}
          onReset={() => {
            reset()
            setErrors({})
            toast.message('Form reset')
          }}
          createLabel="Create"
          updateLabel="Update"
        />
      </form>
    </Modal>
  )
}
