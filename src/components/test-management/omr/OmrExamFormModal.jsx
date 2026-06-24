import { useEffect, useState } from 'react'
import { ScanLine } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import OmrExamFormFields, {
  buildOmrForm,
  useOmrExamFormValidation,
} from './OmrExamFormFields'
import OmrTableSkeleton from './OmrTableSkeleton'
import { getModalEditKey, useInitOnModalOpen } from '../../../hooks/modalFormSync'
import { createOmrExam, getOmrExamById, updateOmrExam } from '../../../services/omrService'
import { mapApiOmrExamToLocal } from '../../../utils/omrApiHelpers'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'

export default function OmrExamFormModal({ open, onClose, examId, onSuccess }) {
  const isEdit = Boolean(examId)
  const editKey = getModalEditKey(examId ? { id: examId } : null)

  const [form, setForm] = useState(buildOmrForm(null))
  const { errors, setErrors, validate } = useOmrExamFormValidation()
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useInitOnModalOpen(open, editKey, () => {
    setErrors({})
    if (!isEdit) {
      setForm(buildOmrForm(null))
    }
  })

  useEffect(() => {
    if (!open || !examId) return undefined

    let ignore = false
    setLoading(true)
    getOmrExamById(examId)
      .then((data) => {
        if (ignore) return
        const mapped = mapApiOmrExamToLocal(data) || data
        setForm(buildOmrForm(mapped))
      })
      .catch((err) => {
        if (!ignore) {
          toast.error(getApiErrorMessage(err, 'Failed to load OMR exam'))
          onClose?.()
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [open, examId, onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate(form)) return

    setSubmitting(true)
    try {
      if (isEdit) {
        const updated = await updateOmrExam(examId, form)
        const mapped = mapApiOmrExamToLocal(updated) || updated
        toast.success('OMR exam updated')
        onSuccess?.(mapped)
      } else {
        const created = await createOmrExam(form)
        const mapped = mapApiOmrExamToLocal(created) || created
        toast.success('OMR exam created')
        onSuccess?.(mapped)
      }
      onClose?.()
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, isEdit ? 'Failed to update OMR exam' : 'Failed to create OMR exam'),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting) onClose?.()
      }}
      size="md"
      title={isEdit ? 'Edit OMR Exam' : 'Create OMR Exam'}
      showCloseButton={false}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[min(90vh,720px)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80"
      >
        <ModalPanelHeader
          icon={ScanLine}
          iconClassName="text-[#246392]"
          title={isEdit ? 'Edit OMR Exam' : 'Create OMR Exam'}
          subtitle={
            isEdit
              ? 'Update exam name, date, or status. Result sheets are managed separately.'
              : 'Record an offline OMR exam. Students cannot attempt exams from this module.'
          }
          onClose={() => {
            if (!submitting) onClose?.()
          }}
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          {loading ? (
            <OmrTableSkeleton />
          ) : (
            <OmrExamFormFields
              form={form}
              setForm={setForm}
              errors={errors}
              setErrors={setErrors}
              disabled={submitting}
            />
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || loading}
            className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? (isEdit ? 'Updating…' : 'Saving…') : isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
