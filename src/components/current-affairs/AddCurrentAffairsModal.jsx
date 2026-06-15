import { useCallback, useEffect, useState } from 'react'

import { Layers, Loader2 } from 'lucide-react'

import { toast } from '@/utils/toast'

import { isDailyPracticeCategory } from '../../constants/currentAffairsForm'

import {

  createEmptyCurrentAffairsForm,

  currentAffairsRowToForm,

} from '../../utils/academicsFormMappers'

import { validateCurrentAffairsForm } from '../../utils/currentAffairsValidation'

import { getApiErrorMessage } from '../../utils/apiError'

import {

  buildCurrentAffairFormData,

  buildDailyPracticePayload,

} from '../../utils/currentAffairsApiHelpers'

import {

  createCurrentAffair,

  createDailyPractice,

  getCurrentAffairById,

  getDailyPracticeById,

  updateCurrentAffair,

  updateDailyPracticePaper,

} from '../../services/currentAffairsService'

import { useDailyPracticeMainsCategories } from '../../hooks/useDailyPracticeMainsCategories'

import { getModalEditKey, useInitOnModalOpen } from '../../hooks/modalFormSync'

import { useModalForm } from '../../hooks/useModalForm'

import FormModalSubmitBar from '../common/FormModalSubmitBar'

import Modal from '../ui/Modal'

import CurrentAffairsModalHeader from './CurrentAffairsModalHeader'

import SectionBar from '../courses/SectionBar'

import CurrentAffairsFormFields from './CurrentAffairsFormFields'

import CurrentAffairsQuestionPaperSection from './CurrentAffairsQuestionPaperSection'



export default function AddCurrentAffairsModal({ open, onClose, item, onSuccess }) {

  const [errors, setErrors] = useState({})

  const [fileInputKey, setFileInputKey] = useState(0)

  const [sampleFileInputKey, setSampleFileInputKey] = useState(0)

  const [questionSectionKey, setQuestionSectionKey] = useState(0)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [detailLoading, setDetailLoading] = useState(false)



  const { form, setForm, isEditMode, reset } = useModalForm(

    open,

    item,

    currentAffairsRowToForm,

    createEmptyCurrentAffairsForm,

  )



  const editKey = getModalEditKey(item)

  const editingId = item?.id

  const isDailyPractice = isDailyPracticeCategory(form.category)



  const {

    options: mainsCategoryOptions,

    loading: mainsCategoryLoading,

  } = useDailyPracticeMainsCategories({ enabled: open && isDailyPractice })



  const clearFileInputs = useCallback(() => {

    setFileInputKey((k) => k + 1)

    setSampleFileInputKey((k) => k + 1)

  }, [])



  const handleClose = () => {

    if (isSubmitting) return

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



  useInitOnModalOpen(open, editKey, () => {

    setErrors({})

    if (!editingId) {

      setForm(createEmptyCurrentAffairsForm())

    }

  })



  useEffect(() => {

    if (!open || !editingId) return



    let cancelled = false



    async function loadDetail() {

      setDetailLoading(true)

      try {

        const isDailyPracticeRow = isDailyPracticeCategory(item?.category)

        const detail = isDailyPracticeRow

          ? await getDailyPracticeById(editingId)

          : await getCurrentAffairById(editingId)



        if (cancelled || !detail) return

        setForm({ ...createEmptyCurrentAffairsForm(), ...detail })

        setErrors({})

        setQuestionSectionKey((k) => k + 1)

      } catch (error) {

        if (!cancelled) {

          if (import.meta.env.DEV) {

            console.error('[Current Affairs] Failed to load detail:', error)

          }

          toast.error(getApiErrorMessage(error, 'Failed to load current affairs entry'))

          onClose()

        }

      } finally {

        if (!cancelled) {

          setDetailLoading(false)

        }

      }

    }



    loadDetail()

    return () => {

      cancelled = true

    }

  }, [open, editingId, item?.category, onClose, setForm])



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



  const onSampleFileChange = ({ fileName, file, errorMessage }) => {

    setForm((f) => {

      setErrors((prev) => {

        const next = { ...prev }

        if (errorMessage) {

          next.sampleUpload = errorMessage

        } else {

          delete next.sampleUpload

        }

        return next

      })

      return {

        ...f,

        sampleFileName: fileName,

        sampleFile: file || null,

      }

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



  const handleSubmit = async (e) => {

    e.preventDefault()

    const { valid, errors: nextErrors } = validateCurrentAffairsForm(form, { isEdit: isEditMode })

    setErrors(nextErrors)

    if (!valid) {

      toast.error('Please fix the highlighted fields')

      return

    }



    setIsSubmitting(true)

    try {

      if (isDailyPracticeCategory(form.category)) {

        const payload = buildDailyPracticePayload(form, { isEdit: isEditMode })



        if (isEditMode && editingId) {

          await updateDailyPracticePaper(editingId, payload)

          toast.success('Daily practice paper updated successfully')

        } else {

          await createDailyPractice(payload)

          toast.success('Daily practice paper created successfully')

        }

      } else if (isEditMode && editingId) {

        const formData = buildCurrentAffairFormData(form, { isEdit: true })

        await updateCurrentAffair(editingId, formData)

        toast.success('Current affairs updated successfully')

      } else {

        const formData = buildCurrentAffairFormData(form)

        await createCurrentAffair(formData)

        toast.success('Current affairs created successfully')

      }



      onSuccess?.()

      clearFileInputs()

      setErrors({})

      onClose()

    } catch (error) {

      if (import.meta.env.DEV) {

        console.error('[Current Affairs] Save failed:', error)

      }

      toast.error(

        getApiErrorMessage(

          error,

          isEditMode ? 'Failed to update current affairs' : 'Failed to create current affairs',

        ),

      )

    } finally {

      setIsSubmitting(false)

    }

  }



  const showQuestions = isDailyPracticeCategory(form.category)

  const formDisabled = isSubmitting || detailLoading



  return (

    <Modal

      open={open}

      onClose={handleClose}

      size="full"

      title={isEditMode ? 'Edit Current Affairs' : 'Add Current Affairs'}

      showCloseButton={false}

    >

      <form

        onSubmit={handleSubmit}

        className="overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]"

      >

        <CurrentAffairsModalHeader

          title={isEditMode ? 'Edit Current Affairs' : 'Add Current Affairs'}

          onClose={handleClose}

          icon={Layers}

          closeDisabled={isSubmitting}

        />



        <div className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6">

          <SectionBar title="Current Affairs Details" />



          {detailLoading ? (

            <div className="flex items-center justify-center gap-3 py-16 text-[#246392]">

              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />

              <span className="text-sm font-semibold">Loading entry details…</span>

            </div>

          ) : (

            <>

              <CurrentAffairsFormFields

                form={form}

                errors={errors}

                fileInputKey={fileInputKey}

                sampleFileInputKey={sampleFileInputKey}

                onCategoryChange={handleCategoryChange}

                onFieldChange={onFieldChange}

                onFileChange={onFileChange}

                onSampleFileChange={onSampleFileChange}

                onClearError={onClearError}

                mainsCategoryOptions={mainsCategoryOptions}

                mainsCategoryLoading={mainsCategoryLoading}

              />



              {showQuestions ? (

                <CurrentAffairsQuestionPaperSection

                  key={questionSectionKey}

                  form={form}

                  errors={errors}

                  onPatch={handlePatch}

                  currentAffairId={isEditMode ? editingId : null}

                />

              ) : null}

            </>

          )}



          <FormModalSubmitBar

            isEditMode={isEditMode}

            onReset={handleReset}

            isSubmitting={isSubmitting}

            disableSubmit={formDisabled}

            disableReset={formDisabled}

            className="pt-2"

            createLabel="Save"

            updateLabel="Save"

          />

        </div>

      </form>

    </Modal>

  )

}


