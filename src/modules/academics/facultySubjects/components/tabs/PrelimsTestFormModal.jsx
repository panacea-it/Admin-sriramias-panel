import { useEffect, useMemo, useState } from 'react'
import SubjectContentFormModal from '../../../../../components/subject-content/SubjectContentFormModal'
import BatchMultiSearchSelect from '../../../../../components/subjects/BatchMultiSearchSelect'
import PrelimsLanguageMultiSelect from '../../../../../components/subjects/prelims/PrelimsLanguageMultiSelect'
import PrelimsAttemptSettings from '../../../../../components/subjects/prelims/PrelimsAttemptSettings'
import PrelimsRandomizationSettings from '../../../../../components/subjects/prelims/PrelimsRandomizationSettings'
import { useFacultySubjectBatchesDropdown } from '../../../../../hooks/useFacultySubjectBatchesDropdown'
import { usePrelimsTestCreateForm } from '../../../../../hooks/useSubjectPrelimsTests'
import useTestConfigurationMaster from '../../../../../hooks/useTestConfigurationMaster'
import { buildPrelimsTestCreateFormData } from '../../../../../utils/prelimsTestApiHelpers'
import { mapChildModuleFormErrors } from '../../../../../utils/facultySubjectChildApiHelpers'
import { getApiErrorMessage } from '../../../../../utils/apiError'
import { cn } from '../../../../../utils/cn'
import { toast } from '../../../../../utils/toast'
import { examInputClass, examSectionCardClass } from '../../../../../components/courses/exam/examFormStyles'
import PrelimsQuestionSheetUploadField from '../../../../../components/subjects/prelims/PrelimsQuestionSheetUploadField'

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#333]">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  )
}

const EMPTY_FORM = {
  testName: '',
  languages: [],
  scheduleDate: '',
  scheduleTime: '10:00',
  durationMinutes: '60',
  totalMarks: '100',
  marksPerCorrectAnswer: '2',
  resultDate: '',
  batchIds: [],
  negativeMarking: { enabled: false, preset: '0.25', value: 0 },
  attemptSettings: {
    enabled: false,
    attempts: 1,
    restrictionType: 'LIFETIME',
    showRemainingAttempts: false,
  },
  rankingEnabled: false,
  shuffleQuestions: false,
  shuffleOptions: false,
}

export default function PrelimsTestFormModal({
  open,
  onClose,
  facultySubjectId,
  folderId,
  editDetail,
  loading = false,
  saving = false,
  onCreate,
}) {
  const isEdit = Boolean(editDetail?._id)
  const [form, setForm] = useState(EMPTY_FORM)
  const [questionFiles, setQuestionFiles] = useState({})
  const [fieldErrors, setFieldErrors] = useState({})

  const { languageOptions } = useTestConfigurationMaster()
  const { batches, loading: batchesLoading } = useFacultySubjectBatchesDropdown({
    facultySubjectId,
    requireCenter: false,
    enabled: open && Boolean(facultySubjectId),
  })

  usePrelimsTestCreateForm(
    { facultySubjectId, folderId },
    { enabled: open && Boolean(facultySubjectId) },
  )

  useEffect(() => {
    if (!open) return
    if (editDetail) {
      setForm({
        testName: editDetail.testName || '',
        languages: editDetail.languages || [],
        scheduleDate: editDetail.scheduleDate?.slice?.(0, 10) || '',
        scheduleTime: editDetail.scheduleTime || '10:00',
        durationMinutes: String(editDetail.durationMinutes ?? '60'),
        totalMarks: String(editDetail.totalMarks ?? ''),
        marksPerCorrectAnswer: String(editDetail.marksPerCorrectAnswer ?? ''),
        resultDate: editDetail.resultDate?.slice?.(0, 10) || '',
        batchIds: editDetail.batchIds || [],
        negativeMarking: editDetail.negativeMarking || EMPTY_FORM.negativeMarking,
        attemptSettings: editDetail.attemptSettings || EMPTY_FORM.attemptSettings,
        rankingEnabled: Boolean(editDetail.rankingEnabled),
        shuffleQuestions: Boolean(editDetail.shuffleQuestions),
        shuffleOptions: Boolean(editDetail.shuffleOptions),
      })
    } else {
      setForm(EMPTY_FORM)
      setQuestionFiles({})
    }
    setFieldErrors({})
  }, [open, editDetail])

  const updateForm = (patch) => setForm((prev) => ({ ...prev, ...patch }))

  const validate = () => {
    const errors = {}
    if (!form.testName.trim()) errors.testName = 'Test name is required'
    if (!form.languages.length) errors.languages = 'Select at least one language'
    if (!form.batchIds.length) errors.batchIds = 'Select at least one batch'
    if (!form.scheduleDate) errors.scheduleDate = 'Schedule date is required'
    if (!form.scheduleTime) errors.scheduleTime = 'Schedule time is required'
    if (!form.durationMinutes) errors.durationMinutes = 'Duration is required'
    if (!form.totalMarks) errors.totalMarks = 'Total marks is required'
    if (!form.resultDate) errors.resultDate = 'Result date is required'
    if (!isEdit) {
      for (const lang of form.languages) {
        if (!questionFiles[lang]) errors[`file_${lang}`] = `Upload question sheet for ${lang}`
      }
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (isEdit) {
      toast.info('Use question upload tools to update sheets. Metadata edit coming soon.')
      return
    }
    if (!validate()) return

    const payload = {
      ...form,
      facultySubjectId,
      folderId,
      durationMinutes: Number(form.durationMinutes),
      totalMarks: Number(form.totalMarks),
      marksPerCorrectAnswer: Number(form.marksPerCorrectAnswer),
    }

    const files = form.languages.map((lang) => questionFiles[lang]).filter(Boolean)
    const formData = buildPrelimsTestCreateFormData(payload, { questionFiles: files })

    try {
      await onCreate?.(formData)
    } catch (error) {
      const mapped = mapChildModuleFormErrors(error)
      if (mapped.field) {
        setFieldErrors((prev) => ({ ...prev, [mapped.field]: mapped.message }))
      }
      if (mapped.suggestions?.length) {
        toast.error(mapped.suggestions.join(' '))
      } else {
        toast.error(getApiErrorMessage(error, 'Failed to create prelims test'))
      }
    }
  }

  const languageFileSection = useMemo(
    () =>
      form.languages.map((lang) => (
        <PrelimsQuestionSheetUploadField
          key={lang}
          language={lang}
          file={questionFiles[lang] || null}
          error={fieldErrors[`file_${lang}`]}
          onChange={(file) => {
            setQuestionFiles((prev) => ({ ...prev, [lang]: file || null }))
            if (file) {
              setFieldErrors((prev) => {
                const next = { ...prev }
                delete next[`file_${lang}`]
                return next
              })
            }
          }}
        />
      )),
    [form.languages, fieldErrors, questionFiles],
  )

  return (
    <SubjectContentFormModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Prelims Test' : 'Create Prelims Test'}
      saving={saving || loading}
      onSave={handleSubmit}
    >
      <div className="space-y-4">
        {loading ? <p className="text-sm text-slate-500">Loading form…</p> : null}

        <div>
          <FieldLabel required>Test Name</FieldLabel>
          <input
            value={form.testName}
            onChange={(e) => updateForm({ testName: e.target.value })}
            className={examInputClass}
          />
          {fieldErrors.testName ? <p className="mt-1 text-xs text-red-600">{fieldErrors.testName}</p> : null}
        </div>

        <div>
          <FieldLabel required>Languages</FieldLabel>
          <PrelimsLanguageMultiSelect
            value={form.languages}
            onChange={(languages) => updateForm({ languages })}
            options={languageOptions}
            error={fieldErrors.languages}
          />
        </div>

        <div>
          <FieldLabel required>Batches</FieldLabel>
          <BatchMultiSearchSelect
            batches={batches}
            loading={batchesLoading}
            value={form.batchIds}
            onChange={(batchIds) => updateForm({ batchIds })}
            error={fieldErrors.batchIds}
            hideLabel
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel required>Schedule Date</FieldLabel>
            <input
              type="date"
              value={form.scheduleDate}
              onChange={(e) => updateForm({ scheduleDate: e.target.value })}
              className={examInputClass}
            />
          </div>
          <div>
            <FieldLabel required>Schedule Time</FieldLabel>
            <input
              type="time"
              value={form.scheduleTime}
              onChange={(e) => updateForm({ scheduleTime: e.target.value })}
              className={examInputClass}
            />
          </div>
          <div>
            <FieldLabel required>Duration (minutes)</FieldLabel>
            <select
              value={form.durationMinutes}
              onChange={(e) => updateForm({ durationMinutes: e.target.value })}
              className={examInputClass}
            >
              {['30', '60', '90', '120', '180'].map((v) => (
                <option key={v} value={v}>
                  {v} min
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel required>Result Date</FieldLabel>
            <input
              type="date"
              value={form.resultDate}
              onChange={(e) => updateForm({ resultDate: e.target.value })}
              className={examInputClass}
            />
          </div>
          <div>
            <FieldLabel required>Total Marks</FieldLabel>
            <input
              type="number"
              min="1"
              value={form.totalMarks}
              onChange={(e) => updateForm({ totalMarks: e.target.value })}
              className={examInputClass}
            />
          </div>
          <div>
            <FieldLabel required>Marks per Correct Answer</FieldLabel>
            <input
              type="number"
              min="0"
              step="0.25"
              value={form.marksPerCorrectAnswer}
              onChange={(e) => updateForm({ marksPerCorrectAnswer: e.target.value })}
              className={examInputClass}
            />
          </div>
        </div>

        {!isEdit ? (
          <div className={cn(examSectionCardClass, 'space-y-4 p-4 sm:p-5')}>
            <div>
              <h4 className="text-sm font-semibold text-[#1a3a5c]">Question Sheets</h4>
              <p className="mt-0.5 text-xs text-[#7a8a9a]">
                Upload one sheet per selected language (.xlsx or .csv)
              </p>
            </div>
            {languageFileSection}
          </div>
        ) : (
          <p className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Question sheets can be uploaded or re-uploaded from the test detail actions after creation.
          </p>
        )}

        <PrelimsAttemptSettings
          testSeries={{
            attemptLimitEnabled: form.attemptSettings?.enabled,
            attemptLimit: form.attemptSettings?.attempts,
            attemptRestrictionType: form.attemptSettings?.restrictionType,
            showRemainingAttempts: form.attemptSettings?.showRemainingAttempts,
          }}
          onTestSeriesChange={(patch) => {
            const next = { ...form.attemptSettings }
            if ('attemptLimitEnabled' in patch) next.enabled = patch.attemptLimitEnabled
            if ('attemptLimit' in patch) next.attempts = patch.attemptLimit
            if ('attemptRestrictionType' in patch) next.restrictionType = patch.attemptRestrictionType
            if ('showRemainingAttempts' in patch) next.showRemainingAttempts = patch.showRemainingAttempts
            updateForm({ attemptSettings: next })
          }}
        />
        <PrelimsRandomizationSettings
          testSeries={{
            shuffleQuestions: form.shuffleQuestions,
            shuffleOptions: form.shuffleOptions,
            sectionWiseEnabled: form.rankingEnabled,
          }}
          onTestSeriesChange={(patch) => {
            updateForm({
              shuffleQuestions: patch.shuffleQuestions ?? form.shuffleQuestions,
              shuffleOptions: patch.shuffleOptions ?? form.shuffleOptions,
              rankingEnabled: patch.sectionWiseEnabled ?? form.rankingEnabled,
            })
          }}
          showShuffleSections={false}
        />
      </div>
    </SubjectContentFormModal>
  )
}
