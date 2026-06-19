import { useState } from 'react'
import { ChevronDown, ChevronUp, Minus, Plus } from 'lucide-react'
import ExamToggleSwitch from '../../courses/exam/ExamToggleSwitch'
import { examInputClass } from '../../courses/exam/examFormStyles'
import { cn } from '../../../utils/cn'
import {
  BATCH_DURATION_PRESETS,
  createEmptyPrelimsSection,
  normalizePrelimsSections,
  PRELIMS_SECTION_TIMER_EXPIRY_ACTIONS,
} from '../../../utils/batchTestSeriesForm'
import { parseSectionQuestionCount, resizeSectionQuestionsForCount } from '../../../utils/prelimsSectionQuestions'
import PrelimsSectionQuestionPaper from './PrelimsSectionQuestionPaper'

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#333]">
      {children}
      {required ? <span className="text-red-500"> *</span> : null}
    </label>
  )
}

function fieldErr(errors, key) {
  return errors[key] ? (
    <p className="mt-1 text-xs font-medium text-red-600">{errors[key]}</p>
  ) : null
}

function SectionCard({
  section,
  index,
  errors,
  onChange,
  onDelete,
  canDelete,
  sectionOptions = [],
}) {
  const [expanded, setExpanded] = useState(true)
  const errKey = (suffix) => `testSeries_section_${section.sectionId || index}_${suffix}`

  const update = (patch) => onChange({ ...section, ...patch })

  const masterLinked = section.sectionMasterId
    ? sectionOptions.some((opt) => opt.id === section.sectionMasterId)
    : false

  const handleSectionMasterChange = (masterId) => {
    const master = sectionOptions.find((opt) => opt.id === masterId)
    update({
      sectionMasterId: masterId,
      sectionName: master?.name || '',
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#e5eaf2] bg-[#fafcff] shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 border-b border-[#eef2fc] bg-white px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[#246392]">
            Section {section.order || index + 1}
          </p>
          <p className="truncate text-sm font-semibold text-[#1a3a5c]">
            {section.sectionName?.trim() || 'Untitled section'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              'rounded px-2 py-0.5 text-[10px] font-bold uppercase',
              section.status === 'inactive'
                ? 'bg-slate-200 text-slate-600'
                : 'bg-emerald-100 text-emerald-700',
            )}
          >
            {section.status === 'inactive' ? 'Inactive' : 'Active'}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[#687180]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#687180]" />
          )}
        </div>
      </button>

      {expanded ? (
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel required>Section Name</FieldLabel>
              {sectionOptions.length > 0 ? (
                <>
                  <select
                    value={masterLinked ? section.sectionMasterId : ''}
                    onChange={(e) => handleSectionMasterChange(e.target.value)}
                    className={cn(examInputClass, 'appearance-none', errors[errKey('name')] && 'ring-2 ring-red-400')}
                  >
                    <option value="">Select section from master…</option>
                    {sectionOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  {!masterLinked && section.sectionName?.trim() ? (
                    <p className="mt-1.5 text-xs text-amber-700">
                      Saved section &quot;{section.sectionName}&quot; is no longer in master
                      configuration. Select an active section above.
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <input
                    value={section.sectionName}
                    onChange={(e) => update({ sectionName: e.target.value, sectionMasterId: '' })}
                    placeholder="No master sections configured"
                    disabled
                    className={cn(examInputClass, 'opacity-70')}
                  />
                  <p className="mt-1.5 text-xs text-[#686868]">
                    Add sections in Test Configuration → Section Management.
                  </p>
                </>
              )}
              {fieldErr(errors, errKey('name'))}
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Section Description</FieldLabel>
              <textarea
                value={section.description}
                onChange={(e) => update({ description: e.target.value })}
                rows={2}
                placeholder="Optional description for students"
                className="w-full rounded-xl bg-[#d1e9f6] px-4 py-2.5 text-sm text-[#1a3a5c] outline-none focus:ring-2 focus:ring-[#55ace7]/45"
              />
            </div>

            <div>
              <FieldLabel required>Total Questions</FieldLabel>
              <input
                inputMode="numeric"
                value={section.totalQuestions}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d]/g, '')
                  const count = parseSectionQuestionCount(val)
                  update({
                    totalQuestions: val,
                    questionCount: count,
                    questions: count > 0 ? resizeSectionQuestionsForCount(section.questions || [], count) : [],
                  })
                }}
                placeholder="e.g. 25"
                className={cn(
                  examInputClass,
                  errors[errKey('questions')] && 'ring-2 ring-red-400',
                )}
              />
              {fieldErr(errors, errKey('questions'))}
            </div>

            <div>
              <FieldLabel required>Total Marks</FieldLabel>
              <input
                inputMode="decimal"
                value={section.totalMarks}
                onChange={(e) =>
                  update({ totalMarks: e.target.value.replace(/[^\d.]/g, '') })
                }
                placeholder="e.g. 50"
                className={cn(examInputClass, errors[errKey('marks')] && 'ring-2 ring-red-400')}
              />
              {fieldErr(errors, errKey('marks'))}
            </div>

            <div>
              <FieldLabel required>Marks Per Correct Answer</FieldLabel>
              <input
                inputMode="decimal"
                value={section.marksPerQuestion}
                onChange={(e) =>
                  update({ marksPerQuestion: e.target.value.replace(/[^\d.]/g, '') })
                }
                placeholder="e.g. 2 or 2.5"
                className={cn(
                  examInputClass,
                  errors[errKey('marksPerQuestion')] && 'ring-2 ring-red-400',
                )}
              />
              {fieldErr(errors, errKey('marksPerQuestion'))}
            </div>

            <div>
              <FieldLabel>Negative Marks</FieldLabel>
              <input
                inputMode="decimal"
                value={section.negativeMarks}
                onChange={(e) =>
                  update({ negativeMarks: e.target.value.replace(/[^\d.]/g, '') })
                }
                placeholder="e.g. 0.33"
                className={cn(
                  examInputClass,
                  errors[errKey('negativeMarks')] && 'ring-2 ring-red-400',
                )}
              />
              {fieldErr(errors, errKey('negativeMarks'))}
            </div>

            <div>
              <FieldLabel required>Section Order / Rank</FieldLabel>
              <input
                inputMode="numeric"
                value={section.order}
                onChange={(e) =>
                  update({ order: e.target.value.replace(/[^\d]/g, '') || section.order })
                }
                placeholder="1"
                className={cn(examInputClass, errors[errKey('order')] && 'ring-2 ring-red-400')}
              />
              {fieldErr(errors, errKey('order'))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-[#eef2fc] bg-white p-4">
            <ExamToggleSwitch
              checked={section.status !== 'inactive'}
              onChange={(v) => update({ status: v ? 'active' : 'inactive' })}
              label="Section Status"
              description={section.status !== 'inactive' ? 'Active' : 'Inactive'}
            />
          </div>

          <div className="space-y-3 rounded-xl border border-[#eef2fc] bg-white p-4">
            <ExamToggleSwitch
              checked={Boolean(section.timerEnabled)}
              onChange={(v) => update({ timerEnabled: v })}
              label="Enable Section Timer"
              description="Timer runs independently for this section"
            />
            {section.timerEnabled ? (
              <div className="grid gap-3 sm:max-w-md">
                <FieldLabel required>Section Time Duration</FieldLabel>
                <select
                  value={section.duration}
                  onChange={(e) => update({ duration: e.target.value })}
                  className={cn(examInputClass, 'appearance-none')}
                >
                  {BATCH_DURATION_PRESETS.filter((d) => d.value !== '180').map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
                {section.duration === 'custom' ? (
                  <input
                    value={section.durationCustom}
                    onChange={(e) => update({ durationCustom: e.target.value })}
                    placeholder="e.g. 20 mins"
                    className={examInputClass}
                  />
                ) : null}
                {fieldErr(errors, errKey('duration'))}
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-[#eef2fc] bg-white p-4">
            <ExamToggleSwitch
              checked={Boolean(section.lockSection)}
              onChange={(v) => update({ lockSection: v })}
              label="Lock Section"
              description={
                section.lockSection
                  ? 'Students must complete this section before the next opens'
                  : 'Students can freely navigate sections'
              }
            />
          </div>

          <PrelimsSectionQuestionPaper
            section={section}
            sectionIndex={index}
            errors={errors}
            onSectionChange={onChange}
          />

          {canDelete ? (
            <div className="flex justify-end border-t border-[#eef2fc] pt-3">
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
              >
                <Minus className="h-3.5 w-3.5" />
                Remove Section
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function PrelimsSectionManagement({
  testSeries,
  onTestSeriesChange,
  errors = {},
  sectionOptions = [],
}) {
  const [panelOpen, setPanelOpen] = useState(true)
  const sectionWiseEnabled = Boolean(testSeries.sectionWiseEnabled)
  const sections = normalizePrelimsSections(testSeries.sections || [])

  const updateRoot = (patch) => onTestSeriesChange(patch)

  const updateSections = (nextSections) => {
    updateRoot({ sections: normalizePrelimsSections(nextSections) })
  }

  const addSection = () => {
    const nextOrder = sections.length + 1
    updateSections([...sections, createEmptyPrelimsSection(nextOrder)])
  }

  const updateSection = (sectionId, patch) => {
    updateSections(
      sections.map((s) => (s.sectionId === sectionId ? { ...s, ...patch } : s)),
    )
  }

  const deleteSection = (sectionId) => {
    updateSections(sections.filter((s) => s.sectionId !== sectionId))
  }

  return (
    <div className="rounded-2xl border border-[#e5eaf2] bg-white p-4 shadow-sm sm:p-6">
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        className="mb-4 flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h4 className="text-sm font-bold text-[#1a3a5c] sm:text-base">Section Management</h4>
          <p className="mt-0.5 text-xs text-[#686868]">
            Configure section-wise question structure for this prelims exam
          </p>
        </div>
        {panelOpen ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-[#687180]" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-[#687180]" />
        )}
      </button>

      {panelOpen ? (
        <div className="space-y-5">
          <div className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4 sm:p-5">
            <ExamToggleSwitch
              checked={sectionWiseEnabled}
              onChange={(v) => updateRoot({ sectionWiseEnabled: v })}
              label="Enable Section Wise Questions"
              description={
                sectionWiseEnabled
                  ? 'Students will see and attempt questions section by section'
                  : 'Default prelims flow — no section management required'
              }
            />
          </div>

          {errors.testSeries_sections ? (
            <p className="text-xs font-medium text-red-600">{errors.testSeries_sections}</p>
          ) : null}
          {errors.testSeries_sections_total ? (
            <p className="text-xs font-medium text-red-600">{errors.testSeries_sections_total}</p>
          ) : null}

          {sectionWiseEnabled ? (
            <>
              <div className="rounded-xl border border-[#eef2fc] bg-[#fafcff] p-4 sm:p-5">
                <FieldLabel>When section timer ends</FieldLabel>
                <select
                  value={testSeries.sectionTimerExpiryAction || 'moveNext'}
                  onChange={(e) => updateRoot({ sectionTimerExpiryAction: e.target.value })}
                  className={cn(examInputClass, 'appearance-none')}
                >
                  {PRELIMS_SECTION_TIMER_EXPIRY_ACTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {sections.map((section, index) => (
                  <SectionCard
                    key={section.sectionId}
                    section={section}
                    index={index}
                    errors={errors}
                    onChange={(patch) => updateSection(section.sectionId, patch)}
                    onDelete={() => deleteSection(section.sectionId)}
                    canDelete={sections.length > 1}
                    sectionOptions={sectionOptions}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={addSection}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#55ace7]/50 bg-[#f8fbff] px-4 py-3 text-sm font-semibold text-[#246392] transition hover:border-[#55ace7] hover:bg-[#eef6fc] sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Add Section
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
