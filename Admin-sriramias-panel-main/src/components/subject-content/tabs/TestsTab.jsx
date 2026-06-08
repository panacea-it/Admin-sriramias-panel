import { useState } from 'react'
import { Plus, Pencil, Trash2, Clock, Award } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { generateContentId } from '../../../utils/facultySubjectContentStorage'

const TEST_TYPES = [
  { value: 'mcq', label: 'MCQ Test' },
  { value: 'descriptive', label: 'Descriptive Test' },
  { value: 'assignment', label: 'Assignment' },
]

const DIFFICULTIES = ['easy', 'medium', 'hard']

export default function TestsTab({ topic, onUpdateTopic }) {
  const tests = topic?.tests || []
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    title: '',
    testType: 'mcq',
    linkedTestId: '',
    instructions: '',
    durationMinutes: 60,
    marks: 100,
    difficulty: 'medium',
    status: 'draft',
  })

  const resetForm = () => {
    setForm({
      title: '',
      testType: 'mcq',
      linkedTestId: '',
      instructions: '',
      durationMinutes: 60,
      marks: 100,
      difficulty: 'medium',
      status: 'draft',
    })
    setEditing(null)
    setFormOpen(false)
  }

  const saveTest = () => {
    if (!form.title.trim()) return
    const list = [...tests]
    if (editing) {
      const idx = list.findIndex((t) => t.id === editing.id)
      if (idx >= 0) list[idx] = { ...list[idx], ...form, id: editing.id }
    } else {
      list.push({
        id: generateContentId('tst'),
        ...form,
        durationMinutes: Number(form.durationMinutes) || 0,
        marks: Number(form.marks) || 0,
        orderIndex: list.length,
        createdAt: new Date().toISOString(),
      })
    }
    onUpdateTopic({ tests: list })
    resetForm()
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => {
          resetForm()
          setFormOpen(true)
        }}
        className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a5c] px-4 py-2.5 text-sm font-semibold text-white"
      >
        <Plus className="h-4 w-4" />
        Add Test
      </button>

      {formOpen && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="mb-3 font-semibold text-[#1a3a5c]">
            {editing ? 'Edit test' : 'Create test'}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Test title *"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            />
            <select
              value={form.testType}
              onChange={(e) => setForm((f) => ({ ...f, testType: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {TEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <input
              value={form.linkedTestId}
              onChange={(e) => setForm((f) => ({ ...f, linkedTestId: e.target.value }))}
              placeholder="Link existing test ID (optional)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
              placeholder="Duration (minutes)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              type="number"
              value={form.marks}
              onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))}
              placeholder="Marks"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <select
              value={form.difficulty}
              onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
              placeholder="Instructions"
              rows={3}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveTest}
              className="rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white"
            >
              Save
            </button>
            <button type="button" onClick={resetForm} className="rounded-lg border px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {tests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-500">
          No tests linked to this topic yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tests.map((test) => (
            <div
              key={test.id}
              className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-[#1a3a5c]">{test.title}</h4>
                <span
                  className={cn(
                    'shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase',
                    test.status === 'published'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700',
                  )}
                >
                  {test.status}
                </span>
              </div>
              <p className="mt-1 text-xs capitalize text-slate-500">
                {TEST_TYPES.find((t) => t.value === test.testType)?.label || test.testType}
              </p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {test.durationMinutes} min
                </span>
                <span className="inline-flex items-center gap-1">
                  <Award className="h-3 w-3" />
                  {test.marks} marks
                </span>
                <span className="capitalize">{test.difficulty}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(test)
                    setForm({ ...test, durationMinutes: test.durationMinutes, marks: test.marks })
                    setFormOpen(true)
                  }}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:underline"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateTopic({ tests: tests.filter((t) => t.id !== test.id) })
                  }
                  className="inline-flex items-center gap-1 text-xs text-[#c96565] hover:underline"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
