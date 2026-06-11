import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ChevronRight, Plus } from 'lucide-react'
import SubjectContentFields from '../subjects/SubjectContentFields'
import {
  EMPTY_SUBJECT_FORM,
  buildLiveClassFromForm,
  buildPdfFromForm,
  buildRecordingFromForm,
  subjectToForm,
  validateContentForm,
} from '../subjects/subjectFormUtils'
import { useAuth } from '../../contexts/AuthContext'
import { useLiveClassFormOptions } from '../../hooks/useLiveClassFormOptions'
import { useBatchesData } from '../../hooks/useBatchesData'
import { getLiveClassById } from '../../api/liveClassesHttpAPI'
import { getRecordingById, playRecording } from '../../api/recordingsAPI'
import { useRecordingFormOptions } from '../../hooks/useRecordingFormOptions'
import {
  mapApiLiveClassToFormValues,
  mapApiLiveClassToLocalRow,
  resolveLiveClassApiId,
} from '../../utils/liveClassHelpers'
import {
  mapApiRecordingToFormValues,
  mapApiRecordingToLocalRow,
  mapCreateFormDefaultsToFormValues,
  resolveRecordingApiId,
  resolveRecordingFormIds,
  unwrapPlayRecordingResponse,
  validateRecordingApiPayload,
} from '../../utils/recordingHelpers'
import {
  createRecurrenceFromSubjectForm,
  flattenSubjectsLiveClassesForConflicts,
  getExcludeLessonIds,
} from '../../utils/academicsSubjectsRecurrence'
import { serializeTestSeriesForStorage } from '../../utils/batchTestSeriesForm'
import {
  syncSubjectLiveClassesToModule,
  syncSubjectRecordingsToModule,
} from '../../utils/subjectModuleSync'
import {
  addItemLabelForCategory,
  buildBreadcrumb,
  contentTypeFromCategoryType,
} from '../../utils/facultySubjectHierarchy'
import { parseDateForDisplay } from '../../utils/academicsSubjectsStorage'
import { generateContentId } from '../../utils/facultySubjectContentStorage'
import { enrichFolderItems } from '../../utils/contentItemDisplay'
import FolderContentList from './FolderContentList'
import ContentItemPreviewPanel from './ContentItemPreviewPanel'
import SubjectContentFormModal, { getContentModalTitle } from './SubjectContentFormModal'
import FolderContentTableSkeleton from './FolderContentTableSkeleton'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

export default function SubjectContentFormPanel({
  subject,
  subjects = [],
  facultySubjectId = '',
  category,
  folder,
  item,
  items = [],
  facultyName,
  saving,
  listLoading = false,
  itemCount,
  onSaveItem,
  panelMode = 'list',
  onPanelModeChange,
  onDeleteItem,
  onDuplicateItem,
  onPublishItemQuick,
  previewRow,
  onPreviewRow,
  onSelectItem,
  onStartAddItem,
  addingNew,
  selectedRowIds = [],
  onToggleRowSelect,
  onToggleSelectAllRows,
  onBulkDeleteRequest,
  onBulkDisableRequest,
  onBulkEnableRequest,
}) {
  const { user } = useAuth()
  const actorName = user?.name || user?.email || facultyName || 'Admin'
  const contentType = category ? contentTypeFromCategoryType(category.categoryType) : 'live'

  const [testSeriesErrors, setTestSeriesErrors] = useState({})
  const [recordingUploadError, setRecordingUploadError] = useState(null)
  const [recurring, setRecurring] = useState(false)
  const [recurrence, setRecurrence] = useState(null)
  const [recurrenceEditScope, setRecurrenceEditScope] = useState('series')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [formSaving, setFormSaving] = useState(false)
  const createDefaultsAppliedRef = useRef(false)
  const lastFormSeedKeyRef = useRef('')

  const liveClassData = useMemo(() => {
    if (!item?.linkedExistingFormId || contentType !== 'live') return null
    return subject?.liveClasses?.find((lc) => lc.id === item.linkedExistingFormId) || item.data || null
  }, [item, subject, contentType])

  const recordingData = useMemo(() => {
    if (!item?.linkedExistingFormId || contentType !== 'recording') return null
    return subject?.recordings?.find((r) => r.id === item.linkedExistingFormId) || item.data || null
  }, [item, subject, contentType])

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    getValues,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_SUBJECT_FORM })

  const watchedCenterId = watch('centerId')
  const watchedRecordingCenterId = watch('recordingCenter')
  const watchedBatchId = watch('batchId')
  const {
    batches,
    centers,
    classrooms,
    loadingBatches,
    loadingCenters,
    loadingClassrooms,
  } = useLiveClassFormOptions({
    centerId: watchedCenterId,
    facultySubjectId,
    enabled: contentType === 'live',
  })
  const {
    createFormDefaults,
    teachers: recordingTeachers,
    centers: recordingCenters,
    batches: recordingBatches,
    topics: recordingTopics,
    loadingTeachers: loadingRecordingTeachers,
    loadingCenters: loadingRecordingCenters,
    loadingBatches: loadingRecordingBatches,
    loadingTopics: loadingRecordingTopics,
  } = useRecordingFormOptions({
    facultySubjectId,
    centerId: watchedRecordingCenterId,
    batchId: watchedBatchId,
    enabled: contentType === 'recording' && Boolean(facultySubjectId),
    formOpen: contentType === 'recording' && panelMode === 'form',
    loadCreateForm: contentType === 'recording' && panelMode === 'form' && addingNew,
  })
  const { sourceRows: fallbackBatches, loading: fallbackBatchesLoading } = useBatchesData({
    enabled: contentType !== 'live' && contentType !== 'recording',
  })
  const batchOptions =
    contentType === 'live'
      ? batches
      : contentType === 'recording'
        ? recordingBatches
        : fallbackBatches
  const batchOptionsLoading =
    contentType === 'live'
      ? loadingBatches
      : contentType === 'recording'
        ? loadingRecordingBatches
        : fallbackBatchesLoading

  useEffect(() => {
    if (!folder || !category) return
    let cancelled = false

    const seedKey = `${folder.id}:${category.id}:${item?.id || 'new'}:${addingNew ? 'add' : 'edit'}`
    if (seedKey !== lastFormSeedKeyRef.current) {
      createDefaultsAppliedRef.current = false
      lastFormSeedKeyRef.current = seedKey
    }

    const seedForm = (seeded, recurrenceState = {}) => {
      reset({ ...seeded, contentType })
      setRecurring(Boolean(recurrenceState.recurring))
      setRecurrence(recurrenceState.recurrence || null)
      setTimezone(recurrenceState.timezone || seeded.timezone || 'Asia/Kolkata')
      setTestSeriesErrors({})
      setRecordingUploadError(null)
      clearErrors()
    }

    ;(async () => {
      let seeded = subjectToForm(subject)
      let recurrenceState = {}

      if (contentType === 'live' && liveClassData) {
        const apiId = liveClassData.apiId || liveClassData.id
        if (apiId && /^[a-f0-9]{24}$/i.test(String(apiId))) {
          try {
            const data = await getLiveClassById(apiId)
            const mapped = mapApiLiveClassToFormValues(data, subject)
            if (mapped && !cancelled) {
              seeded = { ...seeded, ...mapped }
              recurrenceState = {
                recurring: mapped.recurring,
                recurrence: mapped.recurrence,
                timezone: mapped.timezone,
              }
            }
          } catch {
            seeded = subjectToForm(subject, liveClassData)
            recurrenceState = {
              recurring: Boolean(liveClassData.recurring),
              recurrence: liveClassData.recurrence || null,
              timezone: liveClassData.timezone || liveClassData.recurrence?.timezone || 'Asia/Kolkata',
            }
          }
        } else {
          seeded = subjectToForm(subject, liveClassData)
          recurrenceState = {
            recurring: Boolean(liveClassData.recurring),
            recurrence: liveClassData.recurrence || null,
            timezone: liveClassData.timezone || liveClassData.recurrence?.timezone || 'Asia/Kolkata',
          }
        }
      } else if (contentType === 'recording' && recordingData) {
        const apiId = resolveRecordingApiId(recordingData)
        if (apiId) {
          try {
            const data = await getRecordingById(apiId)
            const mapped = mapApiRecordingToFormValues(data, subject)
            if (mapped && !cancelled) {
              seeded = { ...seeded, ...mapped }
            }
          } catch {
            seeded = {
              ...subjectToForm(subject),
              recordingLessonName: recordingData.lessonName || item?.title || '',
              recordingCenter: recordingData.centerId || recordingData.center || '',
              recordingTopic: recordingData.topicId || recordingData.topic || '',
              recordingTeacher: recordingData.teacherId || recordingData.teacher || '',
              recordingVideoFileName: recordingData.videoFileName || '',
              recordingVideoDuration: recordingData.videoDuration || '',
              recordingDescription: recordingData.description || '',
              recordingVisibility: recordingData.visibility || 'Published',
              recordingTags: recordingData.tags || '',
              batchId: recordingData.batchId || '',
              batchIds: recordingData.batchId ? [recordingData.batchId] : [],
              contentType: 'recording',
            }
          }
        } else {
          seeded = {
            ...subjectToForm(subject),
            recordingLessonName: recordingData.lessonName || item?.title || '',
            recordingCenter: recordingData.centerId || recordingData.center || '',
            recordingTopic: recordingData.topicId || recordingData.topic || '',
            recordingTeacher: recordingData.teacherId || recordingData.teacher || '',
            recordingVideoFileName: recordingData.videoFileName || '',
            recordingVideoDuration: recordingData.videoDuration || '',
            recordingDescription: recordingData.description || '',
            recordingVisibility: recordingData.visibility || 'Published',
            recordingTags: recordingData.tags || '',
            batchId: recordingData.batchId || '',
            batchIds: recordingData.batchId ? [recordingData.batchId] : [],
            contentType: 'recording',
          }
        }
      } else if (contentType === 'recording' && addingNew) {
        seeded = {
          ...seeded,
          recordingLessonName: '',
          recordingCenter: '',
          recordingTopic: '',
          recordingTeacher: subject?.teacher || facultyName,
          batchId: '',
          batchIds: [],
          contentType: 'recording',
        }
      } else if (
        (contentType === 'test' || contentType === 'mainsAnswerWriting') &&
        item?.testSeries
      ) {
      const itemBatchIds = Array.isArray(item.batchIds)
        ? item.batchIds.map(String).filter(Boolean)
        : item.batchId
          ? [String(item.batchId)]
          : []
      seeded = {
        ...seeded,
        testSeries: item.testSeries,
        batchIds: itemBatchIds.length ? itemBatchIds : seeded.batchIds,
        batchId: itemBatchIds[0] || item.batchId || seeded.batchId,
        contentType,
      }
    } else if (contentType === 'live' && addingNew) {
      seeded = {
        ...seeded,
        classTitle: '',
        contentType: 'live',
        teacher: subject?.teacher || facultyName,
      }
    } else if (contentType === 'test' && addingNew) {
      seeded = { ...seeded, contentType: 'test' }
    }

      if (!cancelled) seedForm(seeded, recurrenceState)
    })()

    return () => {
      cancelled = true
    }
  }, [
    folder?.id,
    category?.id,
    item?.id,
    addingNew,
    contentType,
    subject,
    liveClassData,
    recordingData,
    reset,
    clearErrors,
    facultyName,
  ])

  useEffect(() => {
    if (
      contentType !== 'recording' ||
      !addingNew ||
      !createFormDefaults ||
      createDefaultsAppliedRef.current
    ) {
      return
    }

    const mapped = mapCreateFormDefaultsToFormValues(createFormDefaults, subject)
    if (!mapped) return

    createDefaultsAppliedRef.current = true
    const fields = [
      'recordingCenter',
      'centerId',
      'batchId',
      'batchIds',
      'recordingTopic',
      'recordingTeacher',
      'recordingVisibility',
      'recordingTags',
      'recordingDescription',
    ]
    fields.forEach((field) => {
      const value = mapped[field]
      if (value == null || value === '') return
      const current = getValues(field)
      if (current == null || current === '' || (Array.isArray(current) && !current.length)) {
        setValue(field, value, { shouldDirty: false })
      }
    })
  }, [
    contentType,
    addingNew,
    createFormDefaults,
    subject,
    setValue,
    getValues,
  ])

  useEffect(() => {
    if (contentType !== 'recording' || !watchedBatchId || recordingTopics.length === 0) return
    const currentTopic = getValues('recordingTopic')
    if (currentTopic) return
    if (recordingTopics.length === 1) {
      setValue('recordingTopic', recordingTopics[0].value, { shouldValidate: true })
      clearErrors('recordingTopic')
    }
  }, [contentType, watchedBatchId, recordingTopics, getValues, setValue, clearErrors])

  const watchedDate = watch('date')
  const breadcrumb = buildBreadcrumb({
    subjectName: subject?.subjectName,
    category,
    folder,
    item: addingNew ? null : item,
  })

  const enrichedRows = useMemo(
    () => enrichFolderItems(subject, items, category?.categoryType),
    [subject, items, category?.categoryType],
  )

  const showForm = panelMode === 'form' && Boolean(folder && category)
  const showPreview = panelMode === 'preview' && previewRow
  const showList = panelMode === 'list' && Boolean(folder && category)
  const isEditing = showForm && Boolean(item) && !addingNew
  const modalTitle = category
    ? getContentModalTitle(category.categoryType, isEditing)
    : 'Add Item'

  const handleCloseForm = () => {
    onPanelModeChange?.('list')
  }

  const onFormSubmit = async (values, publish = false) => {
    const recordingFile = getValues('recordingFile')
    const recordingFormOptions =
      contentType === 'recording'
        ? {
            centers: recordingCenters,
            topics: recordingTopics,
            teachers: recordingTeachers,
            batches: recordingBatches,
          }
        : null

    const payload = {
      ...values,
      recordingFile,
      ...(contentType === 'recording' && recordingFormOptions
        ? resolveRecordingFormIds(values, recordingFormOptions)
        : {}),
      contentType,
      recurring,
      recurrence: recurring && recurrence?.enabled ? recurrence : null,
      recurrenceEditScope,
      timezone,
    }

    const validationErrors = validateContentForm(payload, contentType, {
      allSubjects: subjects,
      subjectId: subject?.id || '',
      excludeLessonIds: getExcludeLessonIds(
        subject,
        liveClassData,
        subjects,
      ),
      hasExistingRecordingFile: Boolean(recordingData?.videoFileName),
    })

    if (Object.keys(validationErrors).length) {
      const tsErr = {}
      Object.entries(validationErrors).forEach(([key, message]) => {
        if (key.startsWith('testSeries_')) tsErr[key] = message
        else if (key === 'recurrence') toast.error(message)
        else setError(key, { type: 'manual', message })
      })
      setTestSeriesErrors(tsErr)
      toast.error('Please fix the highlighted fields')
      return
    }

    if (contentType === 'recording' && recordingFormOptions) {
      const recordingErrors = validateRecordingApiPayload(payload, {
        isEdit: isEditing,
        hasExistingFile: Boolean(recordingData?.videoFileName),
        options: recordingFormOptions,
      })
      if (recordingErrors.length) {
        const message = recordingErrors[0]
        if (message.toLowerCase().includes('topic')) {
          setError('recordingTopic', { type: 'manual', message })
        } else if (message.toLowerCase().includes('batch')) {
          setError('batchIds', { type: 'manual', message })
        } else if (message.toLowerCase().includes('center')) {
          setError('recordingCenter', { type: 'manual', message })
        } else if (message.toLowerCase().includes('teacher')) {
          setError('recordingTeacher', { type: 'manual', message })
        } else if (message.toLowerCase().includes('video') || message.toLowerCase().includes('upload')) {
          setError('recordingVideoFileName', { type: 'manual', message })
        }
        toast.error(message)
        return
      }
    }

    if (formSaving) return

    setFormSaving(true)
    try {
      await onSaveItem({
        values: payload,
        contentType,
        publish,
        existingItem: item,
        liveClassData,
        recordingData,
        recordingFormOptions,
      })
      onPanelModeChange?.('list')
      if (contentType === 'live') {
        if (publish) toast.success('Live Class Published Successfully')
        else toast.success(item ? 'Live Class Updated Successfully' : 'Live Class Created Successfully')
      } else if (contentType === 'recording') {
        toast.success(item ? 'Recording updated successfully' : 'Recording created successfully')
      } else if (publish) {
        toast.success('Published successfully')
      } else {
        toast.success('Saved successfully')
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save')
    } finally {
      setFormSaving(false)
    }
  }

  const openAddForm = () => {
    onStartAddItem()
    onPanelModeChange?.('form')
  }

  if (!category) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-semibold text-[#1a3a5c]">Select a content type</p>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Choose Live Class, Recorded Class, or Test Series from the sidebar to manage folders and
          content.
        </p>
      </div>
    )
  }

  if (!folder) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-semibold text-[#1a3a5c]">{category.label}</p>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Select or create a folder (e.g. Constitution of India) to add classes, recordings, or
          tests.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-slate-100 bg-white px-4 py-3 sm:px-6">
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-xs text-slate-500">
          {breadcrumb.map((part, i) => (
            <span key={`${part}-${i}`} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3" />}
              <span
                className={cn(
                  i === breadcrumb.length - 1 && 'font-medium text-[#1a3a5c]',
                )}
              >
                {part}
              </span>
            </span>
          ))}
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-[#1a3a5c] sm:text-2xl">
              {item?.title || folder.folderName}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {folder.description ||
                `Manage ${category.label.toLowerCase()} entries in this folder.`}
            </p>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
              <span>Last updated: {parseDateForDisplay(item?.lastUpdated || folder.updatedAt)}</span>
              <span>Faculty: {facultyName || subject?.teacher || '—'}</span>
              {item && (
                <span
                  className={cn(
                    'font-semibold',
                    item.status === 'published' ? 'text-emerald-600' : 'text-amber-600',
                  )}
                >
                  {item.status === 'published' ? 'Published' : 'Draft'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f8fafc] px-4 py-4 sm:px-6">
        {showList && (
          <div className="mb-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-[#1a3a5c]">
                {category.label} in {folder.folderName}{' '}
                <span className="font-medium text-slate-500">({itemCount ?? items.length})</span>
              </h3>
              <button
                type="button"
                onClick={openAddForm}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                {addItemLabelForCategory(category.categoryType)}
              </button>
            </div>
            {listLoading ? (
              <FolderContentTableSkeleton columnCount={7} rowCount={5} />
            ) : (
              <FolderContentList
                categoryType={category.categoryType}
                rows={enrichedRows}
                activeItemId={item?.id}
                onAdd={openAddForm}
                selectedIds={selectedRowIds}
                onToggleSelect={onToggleRowSelect}
                onToggleSelectAll={onToggleSelectAllRows}
                onBulkDelete={onBulkDeleteRequest}
                onBulkDisable={onBulkDisableRequest}
                onBulkEnable={onBulkEnableRequest}
                onView={async (row) => {
                let preview = row
                if (contentType === 'live') {
                  const apiId = resolveLiveClassApiId(row.payload || {})
                  if (apiId) {
                    try {
                      const data = await getLiveClassById(apiId)
                      const mapped = mapApiLiveClassToLocalRow(data)
                      if (mapped) {
                        preview = {
                          ...row,
                          payload: mapped,
                          classTitle: mapped.classTitle,
                          date: parseDateForDisplay(mapped.date),
                          time: mapped.startTime || mapped.scheduledTime,
                          center: mapped.center,
                          classroom: mapped.classroom || mapped.classRoom,
                          liveStatus: mapped.status,
                        }
                      }
                    } catch (err) {
                      toast.error(err?.message || 'Failed to load live class details')
                      return
                    }
                  }
                } else if (contentType === 'recording') {
                  const apiId = resolveRecordingApiId(row.payload || {})
                  if (apiId) {
                    try {
                      const data = await getRecordingById(apiId)
                      const mapped = mapApiRecordingToLocalRow(data)
                      if (mapped) {
                        preview = {
                          ...row,
                          payload: mapped,
                          videoTitle: mapped.lessonName,
                          duration: mapped.videoDuration,
                          visibility: mapped.visibility,
                          views: mapped.views,
                        }
                      }
                    } catch (err) {
                      toast.error(err?.message || 'Failed to load recording details')
                      return
                    }
                  }
                }
                onPreviewRow?.(preview)
                onPanelModeChange?.('preview')
              }}
              onEdit={(row) => {
                onSelectItem(row.item.id)
                onPanelModeChange?.('form')
              }}
              onDelete={(row) => onDeleteItem?.(row.item)}
              onPublish={(row) => onPublishItemQuick?.(row.item)}
              onDuplicate={(row) => onDuplicateItem?.(row)}
              onPlay={async (row) => {
                let preview = row
                if (contentType === 'recording') {
                  const apiId = resolveRecordingApiId(row.payload || {})
                  if (apiId) {
                    try {
                      const data = await playRecording(apiId)
                      const { playUrl, recording } = unwrapPlayRecordingResponse(data)
                      const mapped = mapApiRecordingToLocalRow(recording) || row.payload
                      preview = {
                        ...row,
                        payload: {
                          ...mapped,
                          playUrl: playUrl || mapped?.playUrl || mapped?.youtubeUrl,
                          youtubeUrl: playUrl || mapped?.youtubeUrl || mapped?.playUrl,
                        },
                        videoTitle: mapped?.lessonName || row.videoTitle,
                        duration: mapped?.videoDuration || row.duration,
                      }
                    } catch (err) {
                      toast.error(err?.message || 'Failed to play recording')
                      return
                    }
                  }
                }
                onPreviewRow?.(preview)
                onPanelModeChange?.('preview')
              }}
              onDownload={() => toast.message('Download started')}
              onPreviewPdf={(row) => {
                onPreviewRow?.(row)
                onPanelModeChange?.('preview')
              }}
              onStartTest={(row) => {
                onSelectItem(row.item.id)
                onPanelModeChange?.('form')
                toast.message('Configure questions in the test form')
              }}
              onEvaluate={(row) => {
                onPreviewRow?.(row)
                onPanelModeChange?.('preview')
              }}
            />
            )}
          </div>
        )}

        {showPreview && (
          <div className="mb-4">
            <ContentItemPreviewPanel
              category={category}
              row={previewRow}
              onClose={() => onPanelModeChange?.('list')}
            />
          </div>
        )}
      </div>

      <SubjectContentFormModal
        open={showForm}
        onClose={handleCloseForm}
        title={modalTitle}
        saving={formSaving || saving}
        onSave={() => handleSubmit((v) => onFormSubmit(v, false))()}
      >
        <form
          id="subject-content-form"
          onSubmit={handleSubmit((v) => onFormSubmit(v, false))}
          className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:p-6"
        >
          <SubjectContentFields
            contentType={contentType}
            register={register}
            control={control}
            errors={errors}
            watch={watch}
            setValue={setValue}
            clearErrors={clearErrors}
            subject={subject}
            liveClass={liveClassData}
            subjects={subjects}
            batches={batchOptions}
            batchesLoading={batchOptionsLoading}
            centerOptions={centers}
            centersLoading={loadingCenters}
            classroomOptions={classrooms}
            classroomsLoading={loadingClassrooms}
            onCenterChange={() => {
              setValue('batchId', '', { shouldValidate: true })
              setValue('batchIds', [], { shouldValidate: true })
              setValue('classroomId', '', { shouldValidate: true })
              setValue('classRoom', '', { shouldValidate: true })
            }}
            recordingCenterOptions={recordingCenters}
            recordingCentersLoading={loadingRecordingCenters}
            recordingTopicOptions={recordingTopics}
            recordingTopicsLoading={loadingRecordingTopics}
            recordingTeacherOptions={recordingTeachers}
            recordingTeachersLoading={loadingRecordingTeachers}
            onRecordingCenterChange={() => {
              setValue('batchId', '', { shouldValidate: true })
              setValue('batchIds', [], { shouldValidate: true })
              setValue('recordingTopic', '', { shouldValidate: true })
            }}
            onRecordingBatchChange={() => {
              setValue('recordingTopic', '', { shouldValidate: true })
            }}
            recurring={recurring}
            onRecurringToggle={(enabled) => {
              setRecurring(enabled)
              if (enabled) {
                setRecurrence((prev) =>
                  prev?.enabled
                    ? prev
                    : createRecurrenceFromSubjectForm({ date: watchedDate, timezone }),
                )
              } else {
                setRecurrence(null)
              }
            }}
            recurrence={recurrence}
            onRecurrenceChange={setRecurrence}
            recurrenceEditScope={recurrenceEditScope}
            onRecurrenceEditScopeChange={setRecurrenceEditScope}
            timezone={timezone}
            onTimezoneChange={setTimezone}
            isRecurringEdit={false}
            lessonsForConflicts={flattenSubjectsLiveClassesForConflicts(subjects)}
            excludeLessonIds={getExcludeLessonIds(subject, liveClassData, subjects)}
            actorName={actorName}
            recordingUploadError={recordingUploadError}
            onRecordingUploadError={setRecordingUploadError}
            testSeriesErrors={testSeriesErrors}
          />
        </form>
      </SubjectContentFormModal>
    </div>
  )
}

/** Build persisted item + subject patch from form submit */
export function buildItemSavePayload({
  values,
  contentType,
  subject,
  existingItem,
  liveClassData,
  recordingData,
  folder,
  category,
  publish,
}) {
  const titleFromForm =
    contentType === 'live'
      ? values.classTitle
      : contentType === 'recording'
        ? values.recordingLessonName
        : values.testSeries?.details?.testName || 'Untitled'

  let subjectPatch = { ...subject }
  let linkedId = existingItem?.linkedExistingFormId

  let itemData = null

  if (contentType === 'live') {
    const built = buildLiveClassFromForm(values, liveClassData, subject)
    built.folderId = folder.id
    built.categoryId = category.id
    built.contentItemId = existingItem?.id
    const list = [...(subject.liveClasses || [])]
    const idx = list.findIndex((lc) => lc.id === built.id)
    if (idx >= 0) list[idx] = built
    else list.push(built)
    subjectPatch.liveClasses = list
    linkedId = built.id
    itemData = built
  } else if (contentType === 'recording') {
    const built = buildRecordingFromForm(values, recordingData, subject)
    built.folderId = folder.id
    built.categoryId = category.id
    built.contentItemId = existingItem?.id
    const list = [...(subject.recordings || [])]
    const idx = list.findIndex((r) => r.id === built.id)
    if (idx >= 0) list[idx] = built
    else list.push(built)
    subjectPatch.recordings = list
    linkedId = built.id
    itemData = built
  } else if (contentType === 'test' || contentType === 'mainsAnswerWriting') {
    const ts = serializeTestSeriesForStorage(values.testSeries)
    linkedId = existingItem?.linkedExistingFormId || generateContentId('ts')
    itemData = { id: linkedId }
    subjectPatch.enableTestSeries = true
  } else if (contentType === 'pdf') {
    const existingPdf = subject?.pdfs?.find((p) => p.id === existingItem?.linkedExistingFormId)
    const built = buildPdfFromForm(values, existingPdf, subject)
    built.folderId = folder.id
    built.categoryId = category.id
    const list = [...(subject.pdfs || [])]
    const idx = list.findIndex((p) => p.id === built.id)
    if (idx >= 0) list[idx] = built
    else list.push(built)
    subjectPatch.pdfs = list
    linkedId = built.id
    itemData = built
  }

  const item = {
    id: existingItem?.id || generateContentId('item'),
    itemType: category.categoryType,
    title: titleFromForm?.trim() || 'Untitled',
    linkedExistingFormId: linkedId,
    status: publish ? 'published' : 'draft',
    lastUpdated: new Date().toISOString(),
    data: itemData,
    testSeries:
      contentType === 'test' || contentType === 'mainsAnswerWriting'
        ? serializeTestSeriesForStorage(values.testSeries)
        : existingItem?.testSeries,
    batchIds:
      contentType === 'test'
        ? Array.isArray(values.batchIds)
          ? values.batchIds.map(String).filter(Boolean)
          : values.batchId
            ? [String(values.batchId)]
            : []
        : existingItem?.batchIds,
    batchId:
      contentType === 'test'
        ? values.batchIds?.[0] || values.batchId || ''
        : existingItem?.batchId,
  }

  return { item, subjectPatch }
}

export async function syncSubjectContentToModules(subjectPatch, contentType, actorName) {
  if (contentType === 'live' && subjectPatch.liveClasses?.length) {
    try {
      await syncSubjectLiveClassesToModule(
        subjectPatch.liveClasses.filter((lc) => !lc.linkedLessonId),
        subjectPatch,
        { actor: actorName },
      )
    } catch {
      toast.error('Saved locally; Live Classes sync failed')
    }
  }
  if (contentType === 'recording' && subjectPatch.recordings?.length) {
    try {
      await syncSubjectRecordingsToModule(subjectPatch.recordings, subjectPatch, {
        actor: actorName,
      })
    } catch {
      toast.error('Saved locally; Recordings sync failed')
    }
  }
}
