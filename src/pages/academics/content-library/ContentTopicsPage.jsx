import { useState } from 'react'
import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import { useContentLibrary } from '../../../contexts/ContentLibraryContext'
import ContentEntityModal from '../../../components/content-library/ContentEntityModal'
import { generateId, upsertContentTopic, deleteContentTopic } from '../../../api/contentLibraryAPI'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'

export default function ContentTopicsPage() {
  const { subjects, topics, refresh, loading } = useContentLibrary()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)

  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s.name]))

  const save = (form) => {
    upsertContentTopic({
      id: edit?.id || generateId('top'),
      name: form.name,
      subjectId: form.subjectId,
      chapter: form.chapter,
      description: form.description,
      displayOrder: Number(form.displayOrder) || 1,
      status: form.status || 'Active',
    })
    toast.success(edit ? 'Topic updated' : 'Topic created')
    refresh()
  }

  const columns = [
    { key: 'grip', label: '', render: () => <GripVertical className="h-4 w-4 text-slate-300" /> },
    { key: 'name', label: 'Topic' },
    {
      key: 'subject',
      label: 'Subject',
      render: (row) => subjectMap[row.subjectId] || '—',
    },
    { key: 'chapter', label: 'Chapter' },
    { key: 'displayOrder', label: 'Order' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => { setEdit(row); setOpen(true) }} className="text-[#55ace7]">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              deleteContentTopic(row.id)
              toast.success('Topic deleted')
              refresh()
            }}
            className="text-[#c96565]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setEdit(null); setOpen(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Add topic
        </button>
      </div>
      {!loading && (
        <PaginatedFigmaTable columns={columns} data={topics} itemLabel="topics" emptyMessage="No topics yet." />
      )}
      <ContentEntityModal
        open={open}
        onClose={() => setOpen(false)}
        title={edit ? 'Edit topic' : 'Add topic'}
        initial={edit || { status: 'Active', subjectId: subjects[0]?.id }}
        fields={[
          { name: 'name', label: 'Topic name', required: true },
          {
            name: 'subjectId',
            label: 'Subject',
            type: 'select',
            required: true,
            options: subjects.map((s) => ({ value: s.id, label: s.name })),
          },
          { name: 'chapter', label: 'Chapter' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'displayOrder', label: 'Display order', type: 'number' },
        ]}
        onSubmit={save}
      />
    </div>
  )
}
