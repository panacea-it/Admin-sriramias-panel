import { useState } from 'react'
import { UploadCloud, FileSpreadsheet } from 'lucide-react'
import { toast } from '@/utils/toast'
import { useContentLibrary } from '../../../contexts/ContentLibraryContext'
import { mapUploadedFiles, EMPTY_CONTENT_FORM } from '../../../utils/contentLibraryMappers'
import { UploadFieldHint, UploadValidationMessage } from '../../../components/common/UploadFieldHint'
import { validateUploadFile, validateUploadFiles } from '../../../utils/uploadValidation'

export default function BulkUploadPage() {
  const { saveItem, refresh } = useContentLibrary()
  const [files, setFiles] = useState([])
  const [tags, setTags] = useState('')
  const [publish, setPublish] = useState(false)
  const [csvRows, setCsvRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const handleBulkFiles = async (list) => {
    const result = await validateUploadFiles(list, 'CONTENT_LIBRARY_FILES', { checkDimensions: false })
    if (!result.valid) {
      setUploadError(result.message)
      return
    }
    setUploadError(null)
    setFiles(mapUploadedFiles(list))
  }

  const handleCsv = async (file) => {
    const result = await validateUploadFile(file, 'CSV_METADATA', { checkDimensions: false })
    if (!result.valid) {
      setUploadError(result.message)
      return
    }
    setUploadError(null)
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result || ''
      const lines = String(text).trim().split('\n').slice(1)
      const rows = lines.map((line) => {
        const [title, contentType, subject, tagsCol] = line.split(',').map((s) => s.trim())
        return { title, contentType, subject, tags: tagsCol }
      })
      setCsvRows(rows)
      toast.success(`Imported ${rows.length} metadata rows`)
    }
    reader.readAsText(file)
  }

  const runBulk = async () => {
    setBusy(true)
    try {
      const rows = csvRows.length
        ? csvRows
        : files.map((f) => ({ title: f.name.replace(/\.[^.]+$/, ''), contentType: f.contentType, tags: tags }))
      for (const row of rows) {
        const form = {
          ...EMPTY_CONTENT_FORM,
          title: row.title,
          contentType: row.contentType || 'PDF',
          tags: row.tags || tags,
          files: files.filter((f) => f.name.includes(row.title?.slice(0, 8) || '___')),
        }
        if (!form.files.length && files.length === 1) form.files = files
        await saveItem(form, null, {
          status: publish ? 'Published' : 'Draft',
          publishedAt: publish ? new Date().toISOString() : '',
        })
      }
      toast.success(`Bulk processed ${rows.length} item(s)`)
      setFiles([])
      setCsvRows([])
      await refresh()
    } catch {
      toast.error('Bulk upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <UploadCloud className="mx-auto h-12 w-12 text-[#55ace7]" />
        <p className="mt-2 font-semibold text-[#1a3a5c]">Multiple files & ZIP</p>
        <UploadFieldHint profile="CONTENT_LIBRARY_FILES" className="text-sm text-slate-500" />
        <label className="mt-4 inline-block cursor-pointer rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white">
          Select files
          <input type="file" multiple className="hidden" onChange={(e) => handleBulkFiles(e.target.files)} />
        </label>
        <UploadValidationMessage message={uploadError} className="mt-2" />
        {files.length > 0 && <p className="mt-2 text-sm text-slate-600">{files.length} file(s) queued</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="flex items-center gap-2 font-bold text-[#1a3a5c]">
          <FileSpreadsheet className="h-5 w-5" /> CSV metadata import
        </h3>
        <p className="mt-1 text-sm text-slate-500">Columns: title, contentType, subject, tags</p>
        <UploadFieldHint profile="CSV_METADATA" className="mt-1" />
        <label className="mt-3 inline-block cursor-pointer text-sm font-medium text-[#55ace7]">
          Upload CSV
          <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && handleCsv(e.target.files[0])} />
        </label>
        {csvRows.length > 0 && <p className="mt-2 text-sm">{csvRows.length} rows loaded</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
        <label className="block text-sm font-medium">Bulk tags (comma-separated)</label>
        <input
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
          Bulk publish after upload
        </label>
        <button
          type="button"
          disabled={busy || (!files.length && !csvRows.length)}
          onClick={runBulk}
          className="rounded-lg bg-[#69df66] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? 'Processing…' : 'Run bulk upload'}
        </button>
      </section>
    </div>
  )
}
