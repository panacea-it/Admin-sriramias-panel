import { useState } from 'react'
import { GripVertical, Pencil, Plus } from 'lucide-react'
import { toast } from '@/utils/toast'
import { useContentLibrary } from '../../../contexts/ContentLibraryContext'
import ContentEntityModal from '../../../components/content-library/ContentEntityModal'
import { generateId, upsertContentSubject } from '../../../api/contentLibraryAPI'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import { StatusBadge } from '../../../components/academics/AcademicsUi'

export default function ContentSubjectsPage() {
  const { subjects, refresh, loading } = useContentLibrary()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)

  const save = (form) => {
    upsertContentSubject({
      id: edit?.id || generateId('sub'),
      name: form.name,
      code: form.code,
      description: form.description,
      icon: form.icon || '📚',
      color: form.color || '#55ace7',
      status: form.status || 'Active',
      displayOrder: Number(form.displayOrder) || subjects.length + 1,
    })
    toast.success(edit ? 'Subject updated' : 'Subject created')
    refresh()
  }

  const columns = [
    {
      key: 'order',
      label: '',
      render: () => <GripVertical className="h-4 w-4 text-slate-300" />,
    },
    {
      key: 'name',
      label: 'Subject',
      render: (row) => (
        <span className="flex items-center gap-2 font-medium">
          <span>{row.icon}</span> {row.name}
        </span>
      ),
    },
    { key: 'code', label: 'Code' },
    { key: 'description', label: 'Description' },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => { setEdit(row); setOpen(true) }} className="text-[#55ace7]" aria-label="Edit subject">
            <Pencil className="h-4 w-4" />
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
          <Plus className="h-4 w-4" /> Add subject
        </button>
      </div>
      {!loading && (
        <PaginatedFigmaTable columns={columns} data={subjects} itemLabel="subjects" emptyMessage="No subjects yet." />
      )}
      <ContentEntityModal
        open={open}
        onClose={() => setOpen(false)}
        title={edit ? 'Edit subject' : 'Add subject'}
        initial={edit || { status: 'Active', color: '#55ace7', icon: '📚' }}
        fields={[
          { name: 'name', label: 'Subject name', required: true },
          { name: 'code', label: 'Subject code' },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'icon', label: 'Icon (emoji)' },
          { name: 'color', label: 'Color (hex)' },
          { name: 'displayOrder', label: 'Display order', type: 'number' },
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { value: 'Active', label: 'Active' },
              { value: 'In Active', label: 'Deactivated' },
            ],
          },
        ]}
        onSubmit={save}
      />
    </div>
  )
}
