import { Plus, X } from 'lucide-react'
import { CourseFormField, CourseInput, CourseSelect } from '../../courses/CourseFormField'
import { DIFFICULTY_LEVELS } from '../../../data/testConfigurationSeed'
import { createEmptySection } from '../../../utils/testConfigurationValidation'
import { cn } from '../../../utils/cn'

export default function SectionBuilder({ sections, onChange, errors = {} }) {
  const updateSection = (index, patch) => {
    const next = sections.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange(next)
  }

  const addSection = () => {
    onChange([...sections, createEmptySection(sections.length)])
  }

  const removeSection = (index) => {
    if (sections.length <= 1) return
    onChange(sections.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#1a3a5c]">Section Builder</h3>
        <button
          type="button"
          onClick={addSection}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#55ace7] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#4699d4] sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Section
        </button>
      </div>

      {errors.sections && <p className="text-xs font-semibold text-red-600">{errors.sections}</p>}

      {sections.map((section, index) => (
        <div
          key={`section-${index}`}
          className="rounded-xl border border-slate-200 bg-[#f8fafc] p-4 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-[#1a3a5c]">{section.sectionName || `Section ${index + 1}`}</span>
            <button
              type="button"
              onClick={() => removeSection(index)}
              disabled={sections.length <= 1}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40',
              )}
            >
              <X className="h-3.5 w-3.5" />
              Remove
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CourseFormField label="Section Name" required>
              <CourseInput
                value={section.sectionName}
                onChange={(e) => updateSection(index, { sectionName: e.target.value })}
                placeholder={`Section ${index + 1}`}
              />
            </CourseFormField>
            <CourseFormField label="Subject" required>
              <CourseInput
                value={section.subject}
                onChange={(e) => updateSection(index, { subject: e.target.value })}
                placeholder="e.g., Polity"
              />
            </CourseFormField>
            <CourseFormField label="Topic" required>
              <CourseInput
                value={section.topic}
                onChange={(e) => updateSection(index, { topic: e.target.value })}
                placeholder="e.g., Constitution"
              />
            </CourseFormField>
            <CourseFormField label="Difficulty Level">
              <CourseSelect
                value={section.difficultyLevel}
                onChange={(e) => updateSection(index, { difficultyLevel: e.target.value })}
              >
                {DIFFICULTY_LEVELS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </CourseSelect>
            </CourseFormField>
            <CourseFormField label="No. of Questions">
              <CourseInput
                type="number"
                min={1}
                value={section.numberOfQuestions}
                onChange={(e) => updateSection(index, { numberOfQuestions: Number(e.target.value) })}
              />
            </CourseFormField>
            <CourseFormField label="Marks Per Question">
              <CourseInput
                type="number"
                min={0}
                step="0.01"
                value={section.marksPerQuestion}
                onChange={(e) => updateSection(index, { marksPerQuestion: Number(e.target.value) })}
              />
            </CourseFormField>
            <CourseFormField label="Negative Marks">
              <CourseInput
                type="number"
                min={0}
                step="0.01"
                value={section.negativeMarks}
                onChange={(e) => updateSection(index, { negativeMarks: Number(e.target.value) })}
              />
            </CourseFormField>
            <CourseFormField label="Duration (mins)">
              <CourseInput
                type="number"
                min={1}
                value={section.duration}
                onChange={(e) => updateSection(index, { duration: Number(e.target.value) })}
              />
            </CourseFormField>
          </div>
        </div>
      ))}
    </div>
  )
}
