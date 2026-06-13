import { useRef } from 'react'
import { Controller } from 'react-hook-form'
import { Calendar, ChevronDown, FileText, Film } from 'lucide-react'
import TimeDurationFields from './TimeDurationFields'
import BatchSearchSelect from './BatchSearchSelect'
import BatchMultiSearchSelect from './BatchMultiSearchSelect'
import SubjectTestSeriesSection from './SubjectTestSeriesSection'
import SubjectMainsAnswerWritingSection from './SubjectMainsAnswerWritingSection'
import ClassroomSelectField from '../classrooms/ClassroomSelectField'
import RecurringScheduleSection from '../live-classes/RecurringScheduleSection'
import { CourseFormField, CourseSelect } from '../courses/CourseFormField'
import { RECURRENCE_EDIT_SCOPES } from '../../constants/recurrence'
import { TOPIC_DROPDOWN_OPTIONS, CENTER_DROPDOWN_OPTIONS } from '../../data/academicsSubjectsSeed'
import { UploadFieldHint, UploadValidationMessage } from '../common/UploadFieldHint'
import { validateUploadFile } from '../../utils/uploadValidation'
import { patchTestSeriesBlock } from '../../utils/batchTestSeriesForm'
import {
  clampTimeField,
  finalizeTimeField,
  shouldShowLiveClassSection,
  shouldShowPdfSection,
  shouldShowRecordingSection,
  shouldShowTestSeriesSection,
} from './subjectFormUtils'
import { FieldLabel, FormInput, FormSelect, RecurringToggle, SectionTitle } from './subjectFormUi'
import { cn } from '../../utils/cn'

export default function SubjectContentFields({
  contentType,
  register,
  control,
  errors,
  watch,
  setValue,
  clearErrors,
  subject,
  liveClass,
  subjects = [],
  batches = [],
  batchesLoading = false,
  centerOptions = [],
  centersLoading = false,
  classroomOptions = [],
  classroomsLoading = false,
  onCenterChange,
  recurring,
  onRecurringToggle,
  recurrence,
  onRecurrenceChange,
  recurrenceEditScope,
  onRecurrenceEditScopeChange,
  timezone,
  onTimezoneChange,
  isRecurringEdit,
  lessonsForConflicts,
  excludeLessonIds,
  actorName,
  recordingUploadError,
  onRecordingUploadError,
  testSeriesErrors,
  recordingCenterOptions = [],
  recordingCentersLoading = false,
  recordingTopicOptions = [],
  recordingTopicsLoading = false,
  recordingTeacherOptions = [],
  recordingTeachersLoading = false,
  onRecordingCenterChange,
  onRecordingBatchChange,
}) {
  const dateInputRef = useRef(null)
  const dateInputRegister = register('date')
  const values = { categories: subject?.categories, contentType }
  const showLive = shouldShowLiveClassSection(values, { contentType })
  const showRecording = shouldShowRecordingSection(values, { contentType })
  const showTest = shouldShowTestSeriesSection(values, { contentType })
  const showPdf = shouldShowPdfSection(values, { contentType })
  const showMainsAnswerWriting = contentType === 'mainsAnswerWriting'

  const watchedDate = watch('date')
  const watchedTeacher = watch('teacher')
  const watchedCenterId = watch('centerId')
  const watchedRecordingCenterId = watch('recordingCenter')
  const batchId = watch('batchId')
  const batchIds = watch('batchIds') || []
  const selectedCenterId = showRecording ? watchedRecordingCenterId : watchedCenterId

  const liveBatchField = (
    <BatchMultiSearchSelect
      batches={batches}
      loading={batchesLoading}
      value={batchIds.length ? batchIds : batchId ? [batchId] : []}
      onChange={(ids) => {
        setValue('batchIds', ids, { shouldValidate: true, shouldDirty: true })
        setValue('batchId', ids[0] || '', { shouldValidate: true, shouldDirty: true })
        if (showRecording) onRecordingBatchChange?.()
      }}
      error={errors.batchIds?.message || errors.batchId?.message}
      required
      emptyHint={
        !selectedCenterId
          ? 'Select a center first'
          : batchesLoading
            ? 'Loading batches…'
            : 'No batches available'
      }
    />
  )

  const batchBlock = (
    <div className="max-w-md">
      {liveBatchField}
    </div>
  )

  const centerField = (
    <div>
      <FieldLabel required>Center</FieldLabel>
      <Controller
        control={control}
        name="centerId"
        render={({ field }) => (
          <div className="relative">
            <select
              {...field}
              disabled={centersLoading}
              onChange={(e) => {
                field.onChange(e.target.value)
                const selected = centerOptions.find(
                  (o) => String(o.value) === String(e.target.value),
                )
                setValue('center', selected?.label || '', { shouldValidate: true })
                setValue('classroomId', '', { shouldValidate: true })
                setValue('classRoom', '', { shouldValidate: true })
                setValue('batchId', '', { shouldValidate: true })
                setValue('batchIds', [], { shouldValidate: true })
                onCenterChange?.(e.target.value)
              }}
              className={cn(
                'h-11 w-full appearance-none rounded-xl bg-[#d1e9f6] px-4 pr-10 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]/40',
                centersLoading && 'cursor-not-allowed opacity-60',
                errors.center && 'ring-2 ring-red-400',
              )}
            >
              <option value="">
                {centersLoading ? 'Loading centers…' : 'Choose Center'}
              </option>
              {centerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#687180]" />
          </div>
        )}
      />
      {errors.center && <p className="mt-1 text-xs text-red-500">{errors.center.message}</p>}
    </div>
  )

  const classTitleField = (
    <div>
      <FieldLabel required>Class Title</FieldLabel>
      <FormInput register={register} name="classTitle" error={errors.classTitle} placeholder="Class title" />
      {errors.classTitle && <p className="mt-1 text-xs text-red-500">{errors.classTitle.message}</p>}
    </div>
  )

  const classroomField = (
    <Controller
      control={control}
      name="classroomId"
      render={({ field }) => (
        <ClassroomSelectField
          value={field.value}
          onChange={field.onChange}
          date={watchedDate}
          timeHrs={watch('timeHrs')}
          timeMin={watch('timeMin')}
          timeSec={watch('timeSec')}
          durationHrs={watch('durationHrs')}
          durationMin={watch('durationMin')}
          durationSec={watch('durationSec')}
          excludeSourceIds={liveClass?.id ? [liveClass.id] : []}
          error={errors.classRoom?.message}
          required
          label="Select Classroom"
          options={classroomOptions}
          loading={classroomsLoading}
          disabled={!watchedCenterId || classroomsLoading}
        />
      )}
    />
  )

  const dateInputField = (
    <div>
      <FieldLabel required>Date</FieldLabel>
      <div
        className="relative cursor-pointer"
        onClick={() => dateInputRef.current?.showPicker?.()}
      >
        <input
          type="date"
          {...dateInputRegister}
          ref={(el) => {
            dateInputRegister.ref(el)
            dateInputRef.current = el
          }}
          className={cn(
            'h-11 w-full cursor-pointer appearance-none rounded-xl bg-[#d1e9f6] px-4 pr-11 text-sm text-[#222] outline-none focus:ring-2 focus:ring-[#55ace7]/40',
            '[&::-webkit-calendar-picker-indicator]:hidden',
            errors.date && 'ring-2 ring-red-400',
          )}
        />
        <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#df8284]" />
      </div>
      {errors.date && <p className="mt-1 text-xs text-red-500">{errors.date.message}</p>}
    </div>
  )

  const timeField = (
    <Controller
      control={control}
      name="timeHrs"
      render={({ field }) => (
        <TimeDurationFields
          label="Time"
          required
          hrs={field.value}
          min={watch('timeMin')}
          sec={watch('timeSec')}
          onHrsChange={(e) => field.onChange(clampTimeField(e.target.value, 23))}
          onHrsBlur={(e) => field.onChange(finalizeTimeField(e.target.value, 23))}
          onMinChange={(e) =>
            setValue('timeMin', clampTimeField(e.target.value), { shouldDirty: true })
          }
          onMinBlur={(e) =>
            setValue('timeMin', finalizeTimeField(e.target.value), { shouldDirty: true })
          }
          onSecChange={(e) =>
            setValue('timeSec', clampTimeField(e.target.value), { shouldDirty: true })
          }
          onSecBlur={(e) =>
            setValue('timeSec', finalizeTimeField(e.target.value), { shouldDirty: true })
          }
          error={errors.time?.message}
        />
      )}
    />
  )

  const durationField = (
    <Controller
      control={control}
      name="durationHrs"
      render={({ field }) => (
        <TimeDurationFields
          label="Duration"
          hrs={field.value}
          min={watch('durationMin')}
          sec={watch('durationSec')}
          onHrsChange={(e) => field.onChange(clampTimeField(e.target.value, 23))}
          onHrsBlur={(e) => field.onChange(finalizeTimeField(e.target.value, 23))}
          onMinChange={(e) =>
            setValue('durationMin', clampTimeField(e.target.value), { shouldDirty: true })
          }
          onMinBlur={(e) =>
            setValue('durationMin', finalizeTimeField(e.target.value), { shouldDirty: true })
          }
          onSecChange={(e) =>
            setValue('durationSec', clampTimeField(e.target.value), { shouldDirty: true })
          }
          onSecBlur={(e) =>
            setValue('durationSec', finalizeTimeField(e.target.value), { shouldDirty: true })
          }
        />
      )}
    />
  )

  const timezoneField = (
    <CourseFormField label="Timezone">
      <CourseSelect value={timezone} onChange={(e) => onTimezoneChange?.(e.target.value)}>
        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
        <option value="UTC">UTC</option>
        <option value="America/New_York">America/New_York (EST/EDT)</option>
        <option value="Europe/London">Europe/London (GMT/BST)</option>
      </CourseSelect>
    </CourseFormField>
  )

  const liveClassGridFields = (
    <>
      {centerField}
      {liveBatchField}
      {classTitleField}
      {classroomField}
      {dateInputField}
      {timeField}
      {durationField}
      {timezoneField}
    </>
  )

  const prelimsBatchBlock = (
    <div className="max-w-md">
      <BatchMultiSearchSelect
        batches={batches}
        loading={batchesLoading}
        value={batchIds}
        onChange={(ids) => {
          setValue('batchIds', ids, { shouldValidate: true, shouldDirty: true })
          setValue('batchId', ids[0] || '', { shouldValidate: true, shouldDirty: true })
        }}
        error={errors.batchIds?.message || errors.batchId?.message}
        required
      />
    </div>
  )

  return (
    <div className="space-y-5">
      {showLive && (
        <section className="space-y-4">
          <SectionTitle>Live Class Details 6674</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {liveClassGridFields}
          </div>
          <RecurringToggle checked={recurring} onChange={onRecurringToggle} label="Recurring session" />
          {isRecurringEdit && (
            <div className="rounded-xl border border-[#cfe8f8] bg-[#f8fbff] px-4 py-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#246392]">Apply changes to</p>
              <div className="flex flex-wrap gap-2">
                {RECURRENCE_EDIT_SCOPES.map((opt) => (
                  <label key={opt.value} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium">
                    <input
                      type="radio"
                      name="recurrenceEditScope"
                      value={opt.value}
                      checked={recurrenceEditScope === opt.value}
                      onChange={() => onRecurrenceEditScopeChange?.(opt.value)}
                      className="accent-[#246392]"
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          )}
          <RecurringScheduleSection
            enabled={recurring}
            recurrence={recurrence}
            onRecurrenceChange={onRecurrenceChange}
            anchorDate={watchedDate}
            anchorTime={`${watch('timeHrs')}:${watch('timeMin')}`}
            lessons={lessonsForConflicts}
            excludeLessonIds={excludeLessonIds}
            teacher={watchedTeacher || subject?.teacher || ''}
            subjectId={subject?.id || ''}
            actorName={actorName}
            hideRepeatEveryUnlessCustom
          />
        </section>
      )}

      {showRecording && (
        <section className="space-y-4">
          <SectionTitle>Recording Class Details</SectionTitle>
          {batchBlock}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel required>Lesson Name</FieldLabel>
              <FormInput register={register} name="recordingLessonName" error={errors.recordingLessonName} placeholder="Lesson name" />
              {errors.recordingLessonName && <p className="mt-1 text-xs text-red-500">{errors.recordingLessonName.message}</p>}
            </div>
            <div>
              <FieldLabel required>Center</FieldLabel>
              <FormSelect
                register={register}
                name="recordingCenter"
                error={errors.recordingCenter}
                options={recordingCenterOptions}
                placeholder={recordingCentersLoading ? 'Loading centers…' : 'Choose Center'}
                disabled={recordingCentersLoading}
                onChange={() => onRecordingCenterChange?.()}
              />
            </div>
            <div>
              <FieldLabel required>Topic</FieldLabel>
              <FormSelect
                register={register}
                name="recordingTopic"
                error={errors.recordingTopic}
                options={recordingTopicOptions}
                placeholder={
                  recordingTopicsLoading
                    ? 'Loading topics…'
                    : !batchId && !batchIds.length
                      ? 'Select a batch first'
                      : 'Choose Topic'
                }
                disabled={recordingTopicsLoading || (!batchId && !batchIds.length)}
              />
            </div>
            <div>
              <FieldLabel required>Teacher</FieldLabel>
              <FormSelect
                register={register}
                name="recordingTeacher"
                error={errors.recordingTeacher}
                options={recordingTeacherOptions}
                placeholder={recordingTeachersLoading ? 'Loading teachers…' : 'Choose Teacher'}
                disabled={recordingTeachersLoading}
              />
            </div>
            <div>
              <FieldLabel>Tags</FieldLabel>
              <FormInput register={register} name="recordingTags" placeholder="Comma-separated tags" />
            </div>
            <div>
              <FieldLabel>Visibility</FieldLabel>
              <FormSelect register={register} name="recordingVisibility" options={['Published', 'Draft', 'Private']} placeholder="Visibility" />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel required>Upload Recording</FieldLabel>
              <div className="relative">
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-matroska,video/avi,.mp4,.mov,.mkv,.avi"
                  className="sr-only"
                  id="subject-recording-upload-content"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const result = await validateUploadFile(file, 'VIDEO_RECORDING', { checkDimensions: false })
                    if (!result.valid) {
                      onRecordingUploadError?.(result.message)
                      e.target.value = ''
                      return
                    }
                    onRecordingUploadError?.(null)
                    setValue('recordingVideoFileName', file.name, { shouldValidate: true })
                    setValue('recordingFile', file, { shouldDirty: true })
                    clearErrors('recordingVideoFileName')
                  }}
                />
                <label htmlFor="subject-recording-upload-content" className={cn('flex h-11 cursor-pointer items-center justify-between rounded-xl bg-[#d1e9f6] px-4 text-sm text-[#7a8a9a]', errors.recordingVideoFileName && 'ring-2 ring-red-400')}>
                  <span className="truncate">{watch('recordingVideoFileName') || 'Choose video file'}</span>
                  <Film className="h-5 w-5 shrink-0 text-[#55ace7]" />
                </label>
              </div>
              <UploadFieldHint profile="VIDEO_RECORDING" />
              <UploadValidationMessage message={recordingUploadError} />
              {errors.recordingVideoFileName && <p className="mt-1 text-xs text-red-500">{errors.recordingVideoFileName.message}</p>}
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <FieldLabel>Description</FieldLabel>
              <textarea
                {...register('recordingDescription')}
                rows={2}
                className="w-full rounded-xl bg-[#d1e9f6] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/40"
                placeholder="Recording description"
              />
            </div>
          </div>
        </section>
      )}

      {showTest && (
        <div className="space-y-4">
          <div className="max-w-md">{prelimsBatchBlock}</div>
          <SubjectTestSeriesSection watch={watch} setValue={setValue} errors={testSeriesErrors} />
        </div>
      )}

      {showMainsAnswerWriting && (
        <div className="space-y-4">
          <SubjectMainsAnswerWritingSection
            testSeries={watch('testSeries')}
            onTestSeriesChange={(patch) => {
              const prev = watch('testSeries') || {}
              const next = patchTestSeriesBlock(prev, patch)
              setValue('testSeries', next, { shouldDirty: true })
            }}
            errors={testSeriesErrors}
          />
        </div>
      )}

      {showPdf && (
        <section className="space-y-4">
          <SectionTitle>PDF Upload</SectionTitle>
          {batchBlock}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <FieldLabel required>PDF Title</FieldLabel>
              <FormInput register={register} name="pdfTitle" error={errors.pdfTitle} placeholder="PDF title" />
              {errors.pdfTitle && <p className="mt-1 text-xs text-red-500">{errors.pdfTitle.message}</p>}
            </div>
            <div>
              <FieldLabel>Tags</FieldLabel>
              <FormInput register={register} name="pdfTags" placeholder="Comma-separated tags" />
            </div>
            <div>
              <FieldLabel>Visibility</FieldLabel>
              <FormSelect register={register} name="pdfVisibility" options={['Published', 'Draft', 'Private']} placeholder="Visibility" />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel required>Upload PDF</FieldLabel>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="sr-only"
                  id="subject-pdf-upload"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const result = await validateUploadFile(file, 'PDF_STANDARD', { checkDimensions: false })
                    if (!result.valid) {
                      e.target.value = ''
                      return
                    }
                    setValue('pdfFileName', file.name, { shouldValidate: true })
                    clearErrors('pdfFileName')
                  }}
                />
                <label htmlFor="subject-pdf-upload" className={cn('flex h-11 cursor-pointer items-center justify-between rounded-xl bg-[#d1e9f6] px-4 text-sm text-[#7a8a9a]', errors.pdfFileName && 'ring-2 ring-red-400')}>
                  <span className="truncate">{watch('pdfFileName') || 'Choose PDF file'}</span>
                  <FileText className="h-5 w-5 shrink-0 text-[#55ace7]" />
                </label>
              </div>
              <UploadFieldHint profile="PDF_STANDARD" />
              {errors.pdfFileName && <p className="mt-1 text-xs text-red-500">{errors.pdfFileName.message}</p>}
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <FieldLabel>Description</FieldLabel>
              <textarea
                {...register('pdfDescription')}
                rows={2}
                className="w-full rounded-xl bg-[#d1e9f6] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#55ace7]/40"
                placeholder="PDF description"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
