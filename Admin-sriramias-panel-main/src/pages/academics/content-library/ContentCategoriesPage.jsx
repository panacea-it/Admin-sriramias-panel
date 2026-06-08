import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import { useContentLibrary } from '../../../contexts/ContentLibraryContext'
import ContentEntityModal from '../../../components/content-library/ContentEntityModal'
import { generateId, upsertContentCategory, deleteContentCategory } from '../../../api/contentLibraryAPI'

export default function ContentCategoriesPage() {
  const { categories, refresh } = useContentLibrary()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)

  const save = (form) => {
    upsertContentCategory({
      id: edit?.id || generateId('cat'),
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      color: form.color || '#55ace7',
      status: 'Active',
      isSystem: false,
    })
    toast.success('Category saved')
    refresh()
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Reusable categories: Lecture Notes, Practice Material, Assignments, and custom labels.
      </p>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setEdit(null); setOpen(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Custom category
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <article
            key={cat.id}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className="h-10 w-10 rounded-xl"
                style={{ background: cat.color || '#55ace7' }}
              />
              <div>
                <p className="font-semibold text-[#1a3a5c]">{cat.name}</p>
                <p className="text-xs text-slate-500">{cat.slug}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setEdit(cat); setOpen(true) }} className="text-[#55ace7]">
                <Pencil className="h-4 w-4" />
              </button>
              {!cat.isSystem && (
                <button
                  type="button"
                  onClick={() => {
                    deleteContentCategory(cat.id)
                    toast.success('Category removed')
                    refresh()
                  }}
                  className="text-[#c96565]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      <ContentEntityModal
        open={open}
        onClose={() => setOpen(false)}
        title={edit ? 'Edit category' : 'New category'}
        initial={edit || { color: '#55ace7' }}
        fields={[
          { name: 'name', label: 'Category name', required: true },
          { name: 'slug', label: 'Slug' },
          { name: 'color', label: 'Color' },
        ]}
        onSubmit={save}
      />
    </div>
  )
}
