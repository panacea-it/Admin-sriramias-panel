import { useState } from 'react'
import { Plus, Pencil, Clock, Award } from 'lucide-react'
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
      </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
