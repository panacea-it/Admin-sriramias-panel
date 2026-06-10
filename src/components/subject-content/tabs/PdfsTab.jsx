import { useState } from 'react'
import { FileText, Upload, Pencil, Trash2, Download, Eye } from 'lucide-react'
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
              <button
                type="button"
                onClick={savePdf}
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

        {pdfs.length === 0 ? (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm text-slate-500">
            No PDFs uploaded for this topic.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                    <FileText className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate font-semibold text-[#1a3a5c]">{pdf.title}</h4>
                    <p className="text-xs text-slate-500">{formatFileSize(pdf.fileSize)}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {pdf.description || '—'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPreview(pdf)}
                    className="inline-flex items-center gap-1 text-xs text-[#246392]"
                  >
                    <Eye className="h-3 w-3" />
                    Preview
                  </button>
                  {pdf.pdfUrl && (
                    <a
                      href={pdf.pdfUrl}
                      download={pdf.fileName || 'document.pdf'}
                      className="inline-flex items-center gap-1 text-xs text-slate-600"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-slate-600">
                    <Upload className="h-3 w-3" />
                    Replace
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => handleUpload(e, pdf.id)}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(pdf)
                      setForm(pdf)
                      setFormOpen(true)
                    }}
                    className="inline-flex items-center gap-1 text-xs text-slate-600"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateTopic({ pdfs: pdfs.filter((p) => p.id !== pdf.id) })}
                    className="inline-flex items-center gap-1 text-xs text-[#c96565]"
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
