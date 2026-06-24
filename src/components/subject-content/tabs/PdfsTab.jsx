import { useState } from 'react'
import { FileText, Upload, Pencil, Download, Eye } from 'lucide-react'
import { generateContentId } from '../../../utils/facultySubjectContentStorage'

function formatFileSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function PdfsTab({ topic, onUpdateTopic }) {
  const pdfs = topic?.pdfs || []
  const [preview, setPreview] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', pdfUrl: '', fileName: '', fileSize: 0 })

  const resetForm = () => {
    setForm({ title: '', description: '', pdfUrl: '', fileName: '', fileSize: 0 })
    setEditing(null)
    setFormOpen(false)
  }

  const savePdf = () => {
    if (!form.title.trim() || !form.pdfUrl) return
    const list = [...pdfs]
    if (editing) {
      const idx = list.findIndex((p) => p.id === editing.id)
      if (idx >= 0) list[idx] = { ...list[idx], ...form, id: editing.id }
    } else {
      list.push({
        id: generateContentId('pdf'),
        ...form,
        orderIndex: list.length,
        createdAt: new Date().toISOString(),
      })
    }
    onUpdateTopic({ pdfs: list })
    resetForm()
  }

  const handleUpload = (e, replaceId) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') return
    const reader = new FileReader()
    reader.onload = () => {
      const payload = {
        title: file.name.replace(/\.pdf$/i, ''),
        pdfUrl: reader.result,
        fileName: file.name,
        fileSize: file.size,
        description: '',
      }
      if (replaceId) {
        onUpdateTopic({
          pdfs: pdfs.map((p) => (p.id === replaceId ? { ...p, ...payload } : p)),
        })
      } else {
        setForm(payload)
        setFormOpen(true)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 hover:border-[#55ace7]">
          <Upload className="h-4 w-4" />
          Upload PDF
          <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
        </label>

        {formOpen && (
          <div className="rounded-xl border bg-slate-50 p-4">
            <h4 className="mb-3 font-semibold text-[#1a3a5c]">
              {editing ? 'Edit PDF' : 'Add PDF'}
            </h4>
            <div className="space-y-2">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Title *"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Description"
                rows={2}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-3 flex gap-2">
              </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 lg:sticky lg:top-4 lg:self-start">
        <h4 className="mb-3 font-semibold text-[#1a3a5c]">Preview</h4>
        {preview?.pdfUrl ? (
          <iframe
            title={preview.title}
            src={preview.pdfUrl}
            className="h-[min(70vh,480px)] w-full rounded-lg border"
          />
        ) : (
          <p className="py-12 text-center text-sm text-slate-400">
            Select a PDF to preview
          </p>
        )}
      </div>
    </div>
  )
}
