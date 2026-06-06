import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ChevronRight, Loader2, Plus, Save, Upload } from 'lucide-react'
import SubjectContentFields from '../subjects/SubjectContentFields'
import { FormFooter } from '../subjects/subjectFormUi'
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
import { mapApiLiveClassToFormValues } from '../../utils/liveClassHelpers'
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
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

export default function SubjectContentFormPanel({
  subject,
  subjects = [],
  category,
  folder,
  item,
  items = [],
  facultyName,
  saving,
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
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({ defaultValues: EMPTY_SUBJECT_FORM })

  const watchedCenterId = watch('centerId')
  const {
    batches,
    centers,
    classrooms,
    loadingBatches,
    loadingCenters,
    loadingClassrooms,
  } = useLiveClassFormOptions({
    centerId: watchedCenterId,
    enabled: contentType === 'live',
  })
  const { sourceRows: fallbackBatches, loading: fallbackBatchesLoading } = useBatchesData({
    enabled: contentType !== 'live',
  })
  const batchOptions = contentType === 'live' ? batches : fallbackBatches
  const batchOptionsLoading = contentType === 'live' ? loadingBatches : fallbackBatchesLoading

  useEffect(() => {
    if (!folder || !category) return
    let cancelled = false

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
      seeded = {
        ...subjectToForm(subject),
        recordingLessonName: recordingData.lessonName || item?.title || '',
        recordingCenter: recordingData.center || '',
        recordingTopic: recordingData.topic || folder.folderName || '',
        recordingTeacher: recordingData.teacher || subject?.teacher || '',
        recordingVideoFileName: recordingData.videoFileName || '',
        recordingVideoDuration: recordingData.videoDuration || '',
        recordingDescription: recordingData.description || '',
        recordingVisibility: recordingData.visibility || 'Published',
        recordingTags: recordingData.tags || '',
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
    } else if (contentType === 'recording' && addingNew) {
      seeded = {
        ...seeded,
        recordingLessonName: '',
        recordingTopic: folder.folderName,
        recordingTeacher: subject?.teacher || facultyName,
        contentType: 'recording',
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

  const onFormSubmit = async (values, publish = false) => {
    const payload = {
      ...values,
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

    setFormSaving(true)
    try {
      await onSaveItem({
        values: payload,
        contentType,
        publish,
        existingItem: item,
        liveClassData,
        recordingData,
      })
      onPanelModeChange?.('list')
      if (publish) toast.success('Published successfully')
      else toast.success('Saved successfully')
    } catch (err) {
      toast.error(err?.message || 'Failed to save')
    } finally {
      setFormSaving(false)
    }
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
          {panelMode === 'form' && (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={saving || formSaving}
                onClick={() => handleSubmit((v) => onFormSubmit(v, false))()}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-slate-50 disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>
              <button
                type="button"
                disabled={saving || formSaving}
                onClick={() => handleSubmit((v) => onFormSubmit(v, true))()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#152f4a] disabled:opacity-60"
              >
                {formSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Publish Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#f8fafc] px-4 py-4 sm:px-6">
        {showList && (
          <div className="mb-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#1a3a5c]">
                {category.label} in {folder.folderName} ({items.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  onStartAddItem()
                  onPanelModeChange?.('form')
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-[#1a3a5c] px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                {addItemLabelForCategory(category.categoryType)}
              </button>
            </div>
            <FolderContentList
              categoryType={category.categoryType}
              rows={enrichedRows}
              activeItemId={item?.id}
              onView={(row) => {
                onPreviewRow?.(row)
                onPanelModeChange?.('preview')
              }}
              onEdit={(row) => {
                onSelectItem(row.item.id)
                onPanelModeChange?.('form')
              }}
              onDelete={(row) => onDeleteItem?.(row.item)}
              onPublish={(row) => onPublishItemQuick?.(row.item)}
              onDuplicate={(row) => onDuplicateItem?.(row)}
              onPlay={(row) => {
                onPreviewRow?.(row)
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
                toast.message('Configure questions in the test form below')
              }}
              onEvaluate={(row) => {
                onPreviewRow?.(row)
                onPanelModeChange?.('preview')
              }}
            />
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

        {showForm ? (
          <form
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
              onCenterChange={(centerId) => {
                setValue('centerId', centerId, { shouldValidate: true })
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
            <div className="mt-6 border-t border-slate-100 pt-4">
              <FormFooter
                saving={formSaving || saving}
                onReset={() => {
                  const seeded = subjectToForm(subject, liveClassData)
                  reset({ ...seeded, contentType })
                }}
              />
            </div>
          </form>
        ) : null}
      </div>
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
