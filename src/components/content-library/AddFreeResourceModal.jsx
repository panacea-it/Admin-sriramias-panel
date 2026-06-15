import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import { Layers, Loader2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import { createNcertBook, createMockTest, createMockTestQuestion, createPreviousYearPaper, createStudyMaterial, fetchMockTestById, fetchNcertBookById, fetchPreviousYearPaperById, fetchStudyMaterialById, updateMockTest, updateNcertBook, updatePreviousYearPaper, updateStudyMaterial } from '../../api/freeResourcesAPI'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import SectionBar from '../courses/SectionBar'
import { CourseFormField, CourseSelect } from '../courses/CourseFormField'
import {
  createEmptyFreeResourceForm,
  freeResourceRowToForm,
} from '../../utils/academicsFormMappers'
import { useInitOnModalOpen, getModalEditKey } from '../../hooks/modalFormSync'
import { useFreeResourceFormDropdowns } from '../../hooks/useFreeResourceFormDropdowns'
import { useMockTestDropdowns } from '../../hooks/useMockTestDropdowns'
import { useStudyMaterialDropdowns } from '../../hooks/useStudyMaterialDropdowns'
import { usePreviousYearPaperDropdowns } from '../../hooks/usePreviousYearPaperDropdowns'
import {
  FREE_RESOURCE_CATEGORY,
  isQuestionCategory,
  normalizeFreeResourceCategory,
} from '../../utils/freeResourceFormConstants'
import {
  DEFAULT_STATUS_OPTIONS,
  buildMockTestCreatePayload,
  buildMockTestUpdatePayload,
  extractCreatedFreeResourceId,
  getMockTestApiErrorMessage,
  getNcertBookApiErrorMessage,
  getPreviousYearPaperApiErrorMessage,
  getStudyMaterialApiErrorMessage,
  isMockTestsCategory,
  isNcertBooksCategory,
  isPreviousYearPapersCategory,
  isStudyMaterialCategory,
  mapFreeResourceStatusForList,
  mapMockTestApiToForm,
  mapMockTestQuestionUiToApi,
  mapNcertBookApiToForm,
  mapNcertBookStatusForList,
  mapPreviousYearPaperApiToForm,
  mapStudyMaterialApiToForm,
  resolveFreeResourceRendererCategory,
  validateNcertBookPdf,
  validatePreviousYearPaperPdf,
  validateStudyMaterialFile,
} from '../../utils/freeResourceApiHelpers'
import {
  clearDraftStorage,
  isFreeResourceQuestionComplete,
  loadDraftFromStorage,
  parseQuestionCount,
  resizeFreeResourceQuestions,
  saveDraftToStorage,
} from '../../utils/freeResourceFormUtils'
import DynamicFormRenderer from './free-resources/DynamicFormRenderer'
import FormFieldError from './free-resources/FormFieldError'

const CREATE_FORM_DEFAULTS = {
  category: '',
  status: 'ACTIVE',
}

function normalizeCreateFormStatus(status) {
  const value = String(status || '').trim()
  if (value === 'ACTIVE' || value === 'INACTIVE') return value
  if (value === 'Active') return 'ACTIVE'
  if (value === 'In Active' || value === 'Inactive') return 'INACTIVE'
  return 'ACTIVE'
}

function hasUploadedFile(file) {
  return file instanceof Blob && file.size > 0
}

function withUploadFieldValues(values, getValues) {
  return {
    ...values,
    bookFile: getValues('bookFile') ?? values.bookFile,
    bookFileName: getValues('bookFileName') ?? values.bookFileName,
    questionPaperFile: getValues('questionPaperFile') ?? values.questionPaperFile,
    questionPaperFileName: getValues('questionPaperFileName') ?? values.questionPaperFileName,
    studyMaterialFile: getValues('studyMaterialFile') ?? values.studyMaterialFile,
    studyMaterialFileName: getValues('studyMaterialFileName') ?? values.studyMaterialFileName,
    bulkFile: getValues('bulkFile') ?? values.bulkFile,
    bulkFileName: getValues('bulkFileName') ?? values.bulkFileName,
  }
}

function validateNcertBookFields(values, { isEdit = false } = {}) {
  const errors = {}
  if (!String(values.subject || '').trim()) {
    errors.subject = 'Subject is required'
  }
  if (!String(values.className || '').trim()) {
    errors.className = 'Class is required'
  }
  if (!String(values.bookName || '').trim()) {
    errors.bookName = 'Book name is required'
  }
  if (!isEdit && !hasUploadedFile(values.bookFile)) {
    errors.bookFileName = values.bookFileName
      ? 'Please re-select the PDF before saving'
      : 'PDF is required'
  }
  if (!String(values.status || '').trim()) {
    errors.status = 'Status is required'
  }
  return errors
}

function validatePreviousYearPaperFields(values, { isEdit = false } = {}) {
  const errors = {}
  if (!String(values.paperType || '').trim()) {
    errors.paperType = 'Paper type is required'
  }
  if (!String(values.year || '').trim()) {
    errors.year = 'Year is required'
  }
  if (!String(values.paperName || '').trim()) {
    errors.paperName = 'Paper name is required'
  }
  if (!isEdit && !hasUploadedFile(values.questionPaperFile)) {
    errors.questionPaperFileName = values.questionPaperFileName
      ? 'Please re-select the PDF before saving'
      : 'PDF is required'
  }
  if (!String(values.status || '').trim()) {
    errors.status = 'Status is required'
  }
  return errors
}

function validateMockTestFields(values, { isEdit = false } = {}) {
  const errors = {}
  if (!String(values.mockTestTitle || '').trim()) {
    errors.mockTestTitle = 'Mock test title is required'
  }
  if (!isEdit && !String(values.paperType || '').trim()) {
    errors.paperType = 'Paper type is required'
  }
  if (!String(values.duration || '').trim()) {
    errors.duration = 'Duration is required'
  }
  if (!String(values.totalMarks || '').trim()) {
    errors.totalMarks = 'Total marks is required'
  }
  if (!String(values.status || '').trim()) {
    errors.status = 'Status is required'
  }

  if (!isEdit) {
    const hasBulk = hasUploadedFile(values.bulkFile)
    const hasManualQuestions = (values.questions || []).some(isFreeResourceQuestionComplete)
    if (!hasBulk && !hasManualQuestions) {
      errors.bulkFileName = 'Upload questions using Bulk Upload Questions before saving'
    }
  }

  return errors
}

function validateStudyMaterialFields(values, { isEdit = false } = {}) {
  const errors = {}
  if (!String(values.mainsCategory || '').trim()) {
    errors.mainsCategory = 'Main category is required'
  }
  if (!String(values.studyMaterialName || '').trim()) {
    errors.studyMaterialName = 'Study material name is required'
  }
  if (!String(values.status || '').trim()) {
    errors.status = 'Status is required'
  }
  if (!isEdit && !hasUploadedFile(values.studyMaterialFile)) {
    errors.studyMaterialFileName = values.studyMaterialFileName
      ? 'Please re-select the file before saving'
      : 'File is required'
  }
  return errors
}

function resetCreateForm(reset, clearErrors, clearDraftStorage, draftId) {
  reset({
    ...createEmptyFreeResourceForm(),
    ...CREATE_FORM_DEFAULTS,
    bookFile: null,
    bookFileName: '',
    questionPaperFile: null,
    questionPaperFileName: '',
    studyMaterialFile: null,
    studyMaterialFileName: '',
  })
  clearErrors()
  clearDraftStorage(draftId)
}

export default function AddFreeResourceModal({
  open,
  onClose,
  item,
  onSubmit,
  onMockTestSaved,
  onStudyMaterialSaved,
  onNcertBookSaved,
  onPreviousYearPaperSaved,
  viewMode = false,
}) {
  const [draftSavedAt, setDraftSavedAt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [mockTestId, setMockTestId] = useState(null)
  const [studyMaterialId, setStudyMaterialId] = useState(null)
  const [ncertBookId, setNcertBookId] = useState(null)
  const [previousYearPaperId, setPreviousYearPaperId] = useState(null)
  const savingRef = useRef(false)
  const itemRef = useRef(item)
  itemRef.current = item
  const isEditMode = Boolean(item?.id)
  const editKey = getModalEditKey(item)
  const draftId = isEditMode ? `edit-${item?.id}` : 'create'

  const {
    categoryOptions,
    statusOptions,
    categoriesLoading,
    categoriesError,
    retryCategories,
  } = useFreeResourceFormDropdowns(open)

  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    setValue,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...createEmptyFreeResourceForm(),
      ...CREATE_FORM_DEFAULTS,
    },
    shouldUnregister: false,
  })

  const category = watch('category')
  const status = watch('status')
  const prevCategoryRef = useRef('')
  const rendererCategory = useMemo(
    () => resolveFreeResourceRendererCategory(category, categoryOptions),
    [category, categoryOptions],
  )
  const itemResourceCategory = String(item?.resourceCategory || '').toUpperCase()
  const isNcertCreate = !isEditMode && isNcertBooksCategory(category, categoryOptions)
  const isNcertEdit =
    isEditMode &&
    (item?.isApiNcertBook ||
      itemResourceCategory === 'NCERT_BOOKS' ||
      isNcertBooksCategory(item?.category, categoryOptions))
  const isPreviousYearSelected = isPreviousYearPapersCategory(category, categoryOptions)
  const isPreviousYearCreate = !isEditMode && isPreviousYearSelected
  const isPreviousYearEdit =
    isEditMode &&
    (item?.isApiPreviousYearPaper ||
      itemResourceCategory === 'PREVIOUS_YEAR_QUESTIONS' ||
      isPreviousYearPapersCategory(item?.category, categoryOptions))
  const isMockTestSelected = isMockTestsCategory(category, categoryOptions)
  const isMockTestCreate = !isEditMode && isMockTestSelected
  const isMockTestEdit =
    isEditMode &&
    (item?.isApiMockTest ||
      itemResourceCategory === 'FREE_MOCK_TEST' ||
      isMockTestsCategory(item?.category, categoryOptions))
  const isStudyMaterialSelected = isStudyMaterialCategory(category, categoryOptions)
  const isStudyMaterialCreate = !isEditMode && isStudyMaterialSelected
  const isStudyMaterialEdit =
    isEditMode &&
    (item?.isApiStudyMaterial ||
      itemResourceCategory === 'STUDY_MATERIAL' ||
      isStudyMaterialCategory(item?.category, categoryOptions))

  const previousYearPaperDropdowns = usePreviousYearPaperDropdowns(
    open,
    isPreviousYearSelected || isPreviousYearEdit,
  )
  const mockTestDropdowns = useMockTestDropdowns(open, isMockTestSelected)
  const studyMaterialDropdowns = useStudyMaterialDropdowns(open, isStudyMaterialSelected)
  const resolvedStatusOptions =
    statusOptions.length > 0 ? statusOptions : DEFAULT_STATUS_OPTIONS

  useEffect(() => {
    if (!open || isEditMode) return
    const normalizedStatus = normalizeCreateFormStatus(status)
    if (normalizedStatus !== status) {
      setValue('status', normalizedStatus, { shouldDirty: false })
    }
  }, [open, isEditMode, status, setValue])

  useInitOnModalOpen(open, editKey, () => {
    const seeded = freeResourceRowToForm(itemRef.current)
    const draft = !isEditMode ? loadDraftFromStorage(draftId) : null
    const values = draft ? { ...seeded, ...draft } : seeded
    if (draft) {
      values.bookFile = null
      values.bookFileName = ''
      values.questionPaperFile = null
      values.questionPaperFileName = ''
      values.bulkFile = null
      values.bulkFileName = ''
      values.studyMaterialFile = null
      values.studyMaterialFileName = ''
    }
    if (values.questions?.length && values.numberOfQuestions) {
      values.questions = resizeFreeResourceQuestions(
        values.questions,
        parseInt(String(values.numberOfQuestions).replace(/\D/g, ''), 10) || values.questions.length,
      )
    }

    if (!isEditMode) {
      values.category = String(values.category || '').trim()
      values.status = normalizeCreateFormStatus(values.status)
      setMockTestId(null)
      setStudyMaterialId(null)
      setNcertBookId(null)
      setPreviousYearPaperId(null)
    } else {
      values.category = normalizeFreeResourceCategory(values.category)
      values.status = normalizeCreateFormStatus(values.status)
      const editResourceId = itemRef.current?.apiResourceId || itemRef.current?.id || null
      const rowResourceCategory = String(itemRef.current?.resourceCategory || '').toUpperCase()
      setMockTestId(
        itemRef.current?.isApiMockTest ||
          rowResourceCategory === 'FREE_MOCK_TEST' ||
          isMockTestsCategory(values.category, categoryOptions)
          ? editResourceId
          : null,
      )
      setStudyMaterialId(
        itemRef.current?.isApiStudyMaterial ||
          rowResourceCategory === 'STUDY_MATERIAL' ||
          isStudyMaterialCategory(values.category, categoryOptions)
          ? itemRef.current?.apiResourceId || editResourceId
          : null,
      )
      setNcertBookId(
        itemRef.current?.isApiNcertBook ||
          rowResourceCategory === 'NCERT_BOOKS' ||
          isNcertBooksCategory(values.category, categoryOptions)
          ? itemRef.current?.apiResourceId || editResourceId
          : null,
      )
      setPreviousYearPaperId(
        itemRef.current?.isApiPreviousYearPaper ||
          rowResourceCategory === 'PREVIOUS_YEAR_QUESTIONS' ||
          isPreviousYearPapersCategory(values.category, categoryOptions)
          ? itemRef.current?.apiResourceId || editResourceId
          : null,
      )
    }

    reset(values)
    clearErrors()
    prevCategoryRef.current = values.category || ''
  })

  useEffect(() => {
    if (!open || !isMockTestEdit || !mockTestId) return undefined

    let canceled = false
    setDetailLoading(true)

    fetchMockTestById(mockTestId)
      .then((data) => {
        if (canceled) return
        const formValues = mapMockTestApiToForm(data)
        reset((current) => ({
          ...current,
          ...formValues,
          category: FREE_RESOURCE_CATEGORY.MOCK_TEST,
        }))
      })
      .catch((error) => {
        if (canceled) return
        toast.error(getMockTestApiErrorMessage(error, 'Failed to load mock test.'))
      })
      .finally(() => {
        if (!canceled) setDetailLoading(false)
      })

    return () => {
      canceled = true
    }
  }, [open, isMockTestEdit, mockTestId, reset])

  useEffect(() => {
    if (!open || !isStudyMaterialEdit || !studyMaterialId) return undefined

    let canceled = false
    setDetailLoading(true)

    fetchStudyMaterialById(studyMaterialId)
      .then((data) => {
        if (canceled) return
        const formValues = mapStudyMaterialApiToForm(data)
        reset((current) => ({
          ...current,
          ...formValues,
          category: FREE_RESOURCE_CATEGORY.STUDY_MATERIAL,
        }))
      })
      .catch((error) => {
        if (canceled) return
        toast.error(getStudyMaterialApiErrorMessage(error, 'Failed to load study material.'))
      })
      .finally(() => {
        if (!canceled) setDetailLoading(false)
      })

    return () => {
      canceled = true
    }
  }, [open, isStudyMaterialEdit, studyMaterialId, reset])

  useEffect(() => {
    if (!open || !isNcertEdit || !ncertBookId) return undefined

    let canceled = false
    setDetailLoading(true)

    fetchNcertBookById(ncertBookId)
      .then((data) => {
        if (canceled) return
        const formValues = mapNcertBookApiToForm(data, categoryOptions)
        prevCategoryRef.current = formValues.category || ''
        reset((current) => ({
          ...current,
          ...formValues,
        }))
      })
      .catch((error) => {
        if (canceled) return
        toast.error(getNcertBookApiErrorMessage(error, 'Failed to load NCERT book.'))
      })
      .finally(() => {
        if (!canceled) setDetailLoading(false)
      })

    return () => {
      canceled = true
    }
  }, [open, isNcertEdit, ncertBookId, reset, categoryOptions])

  useEffect(() => {
    if (!open || !isPreviousYearEdit || !previousYearPaperId) {
      return undefined
    }

    let canceled = false
    setDetailLoading(true)

    fetchPreviousYearPaperById(previousYearPaperId)
      .then((data) => {
        if (canceled) return
        const formValues = mapPreviousYearPaperApiToForm(data, categoryOptions)
        prevCategoryRef.current = formValues.category || ''
        reset((current) => ({
          ...current,
          ...formValues,
        }))
      })
      .catch((error) => {
        if (canceled) return
        toast.error(getPreviousYearPaperApiErrorMessage(error, 'Failed to load previous year paper.'))
      })
      .finally(() => {
        if (!canceled) setDetailLoading(false)
      })

    return () => {
      canceled = true
    }
  }, [open, isPreviousYearEdit, previousYearPaperId, reset, categoryOptions])

  const formValues = watch()

  useEffect(() => {
    if (!open || isEditMode) return undefined
    const t = setTimeout(() => {
      const {
        bookFile,
        bookFileName,
        questionPaperFile,
        questionPaperFileName,
        studyMaterialFile,
        studyMaterialFileName,
        ...draftValues
      } = formValues
      saveDraftToStorage(draftId, draftValues)
      setDraftSavedAt(new Date())
    }, 900)
    return () => clearTimeout(t)
  }, [formValues, open, draftId, isEditMode])

  useEffect(() => {
    if (!category || category === prevCategoryRef.current) return
    if (!isEditMode && prevCategoryRef.current && prevCategoryRef.current !== category) {
      if (!isQuestionCategory(category)) {
        setValue('questions', [])
        setValue('numberOfQuestions', '')
      }
      setValue('bookFile', null)
      setValue('bookFileName', '')
      setValue('subject', '')
      setValue('className', '')
      setValue('bookName', '')
      setValue('questionPaperFile', null)
      setValue('questionPaperFileName', '')
      setValue('examCategory', '')
      setValue('paperType', '')
      setValue('year', '')
      setValue('paperName', '')
      setValue('mockTestTitle', '')
      setValue('topic', '')
      setValue('duration', '')
      setValue('totalMarks', '')
      setValue('negativeMarking', '')
      setValue('instructions', '')
      setValue('bulkFile', null)
      setValue('bulkFileName', '')
      setValue('mainsCategory', '')
      setValue('studyMaterialName', '')
      setValue('studyMaterialFile', null)
      setValue('studyMaterialFileName', '')
      setMockTestId(null)
      setStudyMaterialId(null)
    }
    prevCategoryRef.current = category
  }, [category, setValue, isEditMode])

  const handleClose = () => {
    onClose()
  }

  const handleReset = () => {
    if (!isEditMode) {
      reset({
        ...createEmptyFreeResourceForm(),
        ...CREATE_FORM_DEFAULTS,
        bookFile: null,
        bookFileName: '',
        questionPaperFile: null,
        questionPaperFileName: '',
        studyMaterialFile: null,
        studyMaterialFileName: '',
      })
      clearErrors()
      clearDraftStorage(draftId)
      prevCategoryRef.current = ''
      setStudyMaterialId(null)
      return
    }

    const seeded = freeResourceRowToForm(item)
    reset(seeded)
    clearErrors()
    prevCategoryRef.current = seeded.category || ''
  }

  const onFormSubmit = async (rawValues) => {
    if (savingRef.current) return
    clearErrors()

    const values = withUploadFieldValues(rawValues, getValues)
    const validationErrors = {}
    if (!String(values.category || '').trim()) {
      validationErrors.category = 'Free resource category is required'
    }

    if (isNcertCreate) {
      Object.assign(validationErrors, validateNcertBookFields(values))
      const pdfCheck = validateNcertBookPdf(values.bookFile)
      if (!pdfCheck.valid && !validationErrors.bookFileName) {
        validationErrors.bookFileName = pdfCheck.message
      }
    } else if (isNcertEdit) {
      Object.assign(validationErrors, validateNcertBookFields(values, { isEdit: true }))
      if (hasUploadedFile(values.bookFile)) {
        const pdfCheck = validateNcertBookPdf(values.bookFile)
        if (!pdfCheck.valid && !validationErrors.bookFileName) {
          validationErrors.bookFileName = pdfCheck.message
        }
      }
    } else if (isPreviousYearCreate) {
      Object.assign(validationErrors, validatePreviousYearPaperFields(values))
      const pdfCheck = validatePreviousYearPaperPdf(values.questionPaperFile)
      if (!pdfCheck.valid && !validationErrors.questionPaperFileName) {
        validationErrors.questionPaperFileName = pdfCheck.message
      }
    } else if (isPreviousYearEdit) {
      Object.assign(validationErrors, validatePreviousYearPaperFields(values, { isEdit: true }))
      if (hasUploadedFile(values.questionPaperFile)) {
        const pdfCheck = validatePreviousYearPaperPdf(values.questionPaperFile)
        if (!pdfCheck.valid && !validationErrors.questionPaperFileName) {
          validationErrors.questionPaperFileName = pdfCheck.message
        }
      }
    } else if (isMockTestCreate || isMockTestEdit) {
      Object.assign(validationErrors, validateMockTestFields(values, { isEdit: isMockTestEdit }))
    } else if (isStudyMaterialCreate || isStudyMaterialEdit) {
      Object.assign(
        validationErrors,
        validateStudyMaterialFields(values, { isEdit: isStudyMaterialEdit }),
      )
      if (isStudyMaterialCreate || hasUploadedFile(values.studyMaterialFile)) {
        const fileCheck = validateStudyMaterialFile(values.studyMaterialFile)
        if (!fileCheck.valid && !validationErrors.studyMaterialFileName) {
          validationErrors.studyMaterialFileName = fileCheck.message
        }
      }
    } else if (!String(values.status || '').trim()) {
      validationErrors.status = 'Status is required'
    }

    if (Object.keys(validationErrors).length) {
      Object.entries(validationErrors).forEach(([key, message]) => {
        setError(key, { type: 'manual', message })
      })
      const firstMessage = Object.values(validationErrors).find(Boolean)
      if (firstMessage) toast.error(firstMessage)
      return
    }

    if (
      !isNcertCreate &&
      !isNcertEdit &&
      !isPreviousYearCreate &&
      !isPreviousYearEdit &&
      !isMockTestCreate &&
      !isMockTestEdit &&
      !isStudyMaterialCreate &&
      !isStudyMaterialEdit
    ) {
      return
    }

    savingRef.current = true
    setSaving(true)
    try {
      if (isNcertCreate) {
        const response = await createNcertBook({
          subject: values.subject,
          className: values.className,
          bookName: values.bookName,
          status: values.status,
          bookFile: values.bookFile,
        })

        const createdId = extractCreatedFreeResourceId(response)

        onSubmit?.(
          {
            ...values,
            category: FREE_RESOURCE_CATEGORY.NCERT,
            status: mapNcertBookStatusForList(values.status),
            apiResourceId: createdId,
          },
          { isEdit: false, id: createdId },
        )
        onNcertBookSaved?.()

        toast.success('NCERT Book created successfully.')
        resetCreateForm(reset, clearErrors, clearDraftStorage, draftId)
        prevCategoryRef.current = ''
        handleClose()
        return
      }

      if (isNcertEdit && ncertBookId) {
        await updateNcertBook(ncertBookId, {
          subject: values.subject,
          className: values.className,
          bookName: values.bookName,
          status: values.status,
          bookFile: values.bookFile,
        })

        onSubmit?.(
          {
            ...values,
            category: FREE_RESOURCE_CATEGORY.NCERT,
            status: mapNcertBookStatusForList(values.status),
            apiResourceId: ncertBookId,
          },
          { isEdit: true, id: ncertBookId },
        )

        onNcertBookSaved?.()

        toast.success('NCERT Book updated successfully.')
        handleClose()
        return
      }

      if (isPreviousYearCreate) {
        const response = await createPreviousYearPaper({
          examCategory: values.examCategory,
          paperType: values.paperType,
          year: values.year,
          paperName: values.paperName,
          status: values.status,
          questionPaperFile: values.questionPaperFile,
        })

        const createdId = extractCreatedFreeResourceId(response)

        onSubmit?.(
          {
            ...values,
            category: FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR,
            status: mapFreeResourceStatusForList(values.status),
            apiResourceId: createdId,
          },
          { isEdit: false, id: createdId },
        )
        onPreviousYearPaperSaved?.()

        toast.success('Previous Year Question Paper created successfully.')
        resetCreateForm(reset, clearErrors, clearDraftStorage, draftId)
        prevCategoryRef.current = ''
        handleClose()
        return
      }

      if (isPreviousYearEdit && previousYearPaperId) {
        await updatePreviousYearPaper(previousYearPaperId, {
          examCategory: values.examCategory,
          paperType: values.paperType,
          year: values.year,
          paperName: values.paperName,
          status: values.status,
          questionPaperFile: values.questionPaperFile,
        })

        onSubmit?.(
          {
            ...values,
            category: FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR,
            status: mapFreeResourceStatusForList(values.status),
            apiResourceId: previousYearPaperId,
          },
          { isEdit: true, id: previousYearPaperId },
        )

        onPreviousYearPaperSaved?.()

        toast.success('Previous Year Question Paper updated successfully.')
        handleClose()
        return
      }

      if (isMockTestEdit && mockTestId) {
        await updateMockTest(mockTestId, {
          ...buildMockTestUpdatePayload(values),
          bulkFile: values.bulkFile,
        })

        onSubmit?.(
          {
            ...values,
            category: FREE_RESOURCE_CATEGORY.MOCK_TEST,
            status: mapFreeResourceStatusForList(values.status),
            apiResourceId: mockTestId,
          },
          { isEdit: true, id: mockTestId },
        )
        onMockTestSaved?.()

        toast.success('Mock test updated successfully.')
        handleClose()
        return
      }

      if (isMockTestCreate) {
        const createPayload = {
          ...buildMockTestCreatePayload(values),
          bulkFile: values.bulkFile,
        }
        const response = await createMockTest(createPayload)
        const createdId = extractCreatedFreeResourceId(response)
        const hasBulkFile = hasUploadedFile(values.bulkFile)

        if (createdId && !hasBulkFile) {
          const questions = resizeFreeResourceQuestions(
            values.questions || [],
            parseQuestionCount(values.numberOfQuestions),
          )
          for (let index = 0; index < questions.length; index += 1) {
            const question = questions[index]
            if (!isFreeResourceQuestionComplete(question)) continue
            await createMockTestQuestion(
              createdId,
              mapMockTestQuestionUiToApi(question, index),
            )
          }
        }

        onSubmit?.(
          {
            ...values,
            category: FREE_RESOURCE_CATEGORY.MOCK_TEST,
            status: mapFreeResourceStatusForList(values.status),
            apiResourceId: createdId,
          },
          { isEdit: false, id: createdId },
        )
        onMockTestSaved?.()

        toast.success('Mock test created successfully.')
        resetCreateForm(reset, clearErrors, clearDraftStorage, draftId)
        prevCategoryRef.current = ''
        setMockTestId(null)
        handleClose()
        return
      }

      if (isStudyMaterialEdit && studyMaterialId) {
        await updateStudyMaterial(studyMaterialId, {
          mainsCategory: values.mainsCategory,
          studyMaterialName: values.studyMaterialName,
          status: values.status,
          studyMaterialFile: values.studyMaterialFile,
        })

        onSubmit?.(
          {
            ...values,
            category: FREE_RESOURCE_CATEGORY.STUDY_MATERIAL,
            status: mapFreeResourceStatusForList(values.status),
            apiResourceId: studyMaterialId,
          },
          { isEdit: true, id: studyMaterialId },
        )
        onStudyMaterialSaved?.()

        toast.success('Study material updated successfully.')
        handleClose()
        return
      }

      if (isStudyMaterialCreate) {
        const response = await createStudyMaterial({
          mainsCategory: values.mainsCategory,
          studyMaterialName: values.studyMaterialName,
          status: values.status,
          studyMaterialFile: values.studyMaterialFile,
        })

        const createdId = extractCreatedFreeResourceId(response)

        onSubmit?.(
          {
            ...values,
            category: FREE_RESOURCE_CATEGORY.STUDY_MATERIAL,
            status: mapFreeResourceStatusForList(values.status),
            apiResourceId: createdId,
          },
          { isEdit: false, id: createdId },
        )
        onStudyMaterialSaved?.()

        toast.success('Study material created successfully.')
        resetCreateForm(reset, clearErrors, clearDraftStorage, draftId)
        prevCategoryRef.current = ''
        setStudyMaterialId(null)
        handleClose()
      }
    } catch (error) {
      if (isNcertCreate || isNcertEdit) {
        toast.error(getNcertBookApiErrorMessage(error))
      } else if (isPreviousYearCreate || isPreviousYearEdit) {
        toast.error(getPreviousYearPaperApiErrorMessage(error))
      } else if (isMockTestCreate || isMockTestEdit) {
        toast.error(getMockTestApiErrorMessage(error))
      } else if (isStudyMaterialCreate || isStudyMaterialEdit) {
        toast.error(getStudyMaterialApiErrorMessage(error))
      } else {
        toast.error(getMockTestApiErrorMessage(error))
      }
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const showStickySave = !viewMode && rendererCategory === FREE_RESOURCE_CATEGORY.MOCK_TEST
  const formDisabled = saving || detailLoading || viewMode
  const modalTitle = viewMode ? 'View Free Resource' : 'Free Resource'

  return (
    <Modal open={open} onClose={handleClose} size="full" title={modalTitle} showCloseButton={false}>
      <form
        onSubmit={viewMode ? (event) => event.preventDefault() : handleSubmit(onFormSubmit)}
        className="flex max-h-[min(92vh,920px)] flex-col overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
      >
        <div className="shrink-0">
          <ModalPanelHeader
            title={modalTitle}
            onClose={handleClose}
            icon={Layers}
            closeVariant="icon"
          />
        </div>

        {showStickySave ? (
          <div className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-[#eef2fc] bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur sm:px-6">
            <p className="text-xs font-semibold text-[#246392]">
              {category}
              {isEditMode ? '' : ` · ${(watch('questions') || []).length} questions`}
            </p>
            {draftSavedAt && !isEditMode ? (
              <span className="text-[10px] text-gray-500">
                Draft saved {draftSavedAt.toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <fieldset
            disabled={viewMode}
            className="space-y-5 px-4 py-5 sm:space-y-6 sm:px-6 sm:py-6 disabled:opacity-100"
          >
            {detailLoading ? (
              <p className="flex items-center gap-2 text-sm text-[#246392]">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isStudyMaterialEdit
                  ? 'Loading study material…'
                  : isNcertEdit
                    ? 'Loading NCERT book…'
                    : isPreviousYearEdit
                      ? 'Loading previous year paper…'
                      : 'Loading mock test…'}
              </p>
            ) : null}

            <SectionBar title="Free Resource Details" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <CourseFormField label="Free Resource Category" required>
                <div className="relative">
                  <CourseSelect
                    {...register('category')}
                    disabled={categoriesLoading}
                    className={categoriesLoading ? 'opacity-70' : undefined}
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories…' : 'Choose category'}
                    </option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </CourseSelect>
                  {categoriesLoading ? (
                    <Loader2
                      className="pointer-events-none absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#246392]"
                      aria-hidden
                    />
                  ) : null}
                </div>
                {categoriesError && !categoriesLoading && categoryOptions.length === 0 ? (
                  <button
                    type="button"
                    onClick={retryCategories}
                    className="text-left text-xs font-medium text-[#246392] underline-offset-2 hover:underline"
                  >
                    Retry loading categories
                  </button>
                ) : null}
                <FormFieldError message={errors.category?.message} />
              </CourseFormField>
              <CourseFormField label="Status" required>
                <CourseSelect {...register('status')}>
                  {resolvedStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </CourseSelect>
                <FormFieldError message={errors.status?.message} />
              </CourseFormField>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={category || 'no-category'}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <DynamicFormRenderer
                  category={rendererCategory}
                  register={register}
                  control={control}
                  watch={watch}
                  setValue={setValue}
                  clearErrors={clearErrors}
                  errors={errors}
                  previousYearDropdowns={
                    rendererCategory === FREE_RESOURCE_CATEGORY.PREVIOUS_YEAR
                      ? previousYearPaperDropdowns
                      : null
                  }
                  mockTestDropdowns={
                    rendererCategory === FREE_RESOURCE_CATEGORY.MOCK_TEST
                      ? mockTestDropdowns
                      : null
                  }
                  mockTestId={isMockTestEdit ? mockTestId : null}
                  questionsLoading={detailLoading}
                  studyMaterialDropdowns={
                    rendererCategory === FREE_RESOURCE_CATEGORY.STUDY_MATERIAL
                      ? studyMaterialDropdowns
                      : null
                  }
                  studyMaterialFileRequired={!isStudyMaterialEdit}
                  ncertBookFileRequired={!isNcertEdit}
                  previousYearFileRequired={!isPreviousYearEdit}
                  mockTestBulkUploadOnly={isMockTestSelected || isMockTestEdit}
                />
              </motion.div>
            </AnimatePresence>
          </fieldset>
        </div>

        <div className="shrink-0 border-t border-slate-200/80 bg-[#f7f7f7] px-4 py-4 sm:px-6">
          {viewMode ? (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="min-w-[148px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-10 py-3.5 text-base font-bold text-white shadow-[0_6px_18px_rgba(5,25,45,0.4)] transition hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
              >
                Close
              </button>
            </div>
          ) : (
            <FormModalSubmitBar
              isEditMode={isEditMode}
              onReset={handleReset}
              isSubmitting={saving || detailLoading}
              disableReset={
                categoriesLoading ||
                saving ||
                detailLoading ||
                previousYearPaperDropdowns.loading ||
                mockTestDropdowns.loading ||
                studyMaterialDropdowns.loading
              }
              createLabel="Save"
              updateLabel="Update"
              loadingLabel="Saving…"
              className="border-0 pt-0"
            />
          )}
        </div>
      </form>
    </Modal>
  )
}
