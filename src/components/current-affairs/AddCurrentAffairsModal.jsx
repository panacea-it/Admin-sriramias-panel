import { useCallback, useState } from 'react'
import { Layers } from 'lucide-react'
import { toast } from '@/utils/toast'
import { isDailyPracticeCategory } from '../../constants/currentAffairsForm'
import {
  createEmptyCurrentAffairsForm,
  currentAffairsRowToForm,
} from '../../utils/academicsFormMappers'
import { validateCurrentAffairsForm } from '../../utils/currentAffairsValidation'
import { useModalForm } from '../../hooks/useModalForm'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import CurrentAffairsFormFields from './CurrentAffairsFormFields'
import CurrentAffairsQuestionPaperSection from './CurrentAffairsQuestionPaperSection'

export default function AddCurrentAffairsModal({ open, onClose, item, onSubmit }) {
  const [errors, setErrors] = useState({})
  const [fileInputKey, setFileInputKey] = useState(0)
  const [questionSectionKey, setQuestionSectionKey] = useState(0)

  const { form, setForm, isEditMode, reset } = useModalForm(
    open,
    item,
    currentAffairsRowToForm,
    createEmptyCurrentAffairsForm,
  )

  const clearFileInputs = useCallback(() => {
    setFileInputKey((k) => k + 1)
  }, [])

  const handleClose = () => {
    clearFileInputs()
    setErrors({})
    onClose()
  }

  const handleReset = () => {
    reset()
    clearFileInputs()
    setErrors({})
    setQuestionSectionKey((k) => k + 1)
  }

  const handleCategoryChange = (e) => {
    const nextCategory = e.target.value
    setForm(createEmptyCurrentAffairsForm(nextCategory))
    clearFileInputs()
    setErrors({})
    setQuestionSectionKey((k) => k + 1)
  }

  const onFieldChange = (key) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const onFileChange = ({ fileName, file, errorMessage }) => {
    setForm((f) => {
      const uploadKey = f.category === 'Monthly Magazine' ? 'magazineUpload' : 'pdfUpload'
      setErrors((prev) => {
        const next = { ...prev }
        if (errorMessage) {
          next[uploadKey] = errorMessage
        } else {
          delete next.pdfUpload
          delete next.magazineUpload
        }
        return next
      })
      return { ...f, fileName, file: file || null }
    })
  }

  const onClearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handlePatch = (patch) => {
    setForm((f) => ({ ...f, ...patch }))
    if (patch.questions) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.questions
        Object.keys(next).forEach((k) => {
          if (k.startsWith('q')) delete next[k]
        })
        return next
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const { valid, errors: nextErrors } = validateCurrentAffairsForm(form)
    setErrors(nextErrors)
    if (!valid) {
      toast.error('Please fix the highlighted fields')
      return
    }

    const payload = { ...form, file: undefined }
    onSubmit?.(payload, { isEdit: isEditMode, id: item?.id })
    toast.success(
      isEditMode
        ? 'Current affairs updated successfully'
        : 'Current affairs created successfully',
    )
    handleClose()
  }

  const showQuestions = isDailyPracticeCategory(form.category)

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="full"
      title={isEditMode ? 'Edit Current Affairs' : 'Add Current Affairs'}
    >
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
      >
        <ModalPanelHeader
          title={isEditMode ? 'Edit Current Affairs' : 'Add Current Affairs'}
          onClose={handleClose}
          icon={Layers}
          closeVariant="icon"
        />

        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">
          <SectionBar title="Current Affairs Details" />

          <CurrentAffairsFormFields
            form={form}
            errors={errors}
            fileInputKey={fileInputKey}
            onCategoryChange={handleCategoryChange}
            onFieldChange={onFieldChange}
            onFileChange={onFileChange}
            onClearError={onClearError}
          />

          {showQuestions ? (
            <CurrentAffairsQuestionPaperSection
              key={questionSectionKey}
              form={form}
              errors={errors}
              onPatch={handlePatch}
              resetKey={questionSectionKey}
            />
          ) : null}

          <FormModalSubmitBar
            isEditMode={isEditMode}
            onReset={handleReset}
            className="pt-2"
            createLabel="Save"
            updateLabel="Save"
          />
        </div>
      </form>
    </Modal>
  )
}
