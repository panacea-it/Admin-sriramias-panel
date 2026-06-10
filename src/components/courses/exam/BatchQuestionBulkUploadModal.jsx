import { useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../ModalPanelHeader'
import { cn } from '../../../utils/cn'
import {
  BULK_UPLOAD_ACCEPT,
  MAX_BULK_FILE_BYTES,
  MAX_BULK_FILES,
} from '../../../utils/batchTestSeriesForm'
import { UploadFieldHint } from '../../common/UploadFieldHint'
import {
  getFileExtension,
  isSupportedBulkExtension,
  parseQuestionBulkFile,
} from '../../../utils/batchQuestionBulkUpload'
import { validateUploadFileSync } from '../../../utils/uploadValidation'

function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function statusIcon(status) {
  if (status === 'success') return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
  if (status === 'error') return <AlertCircle className="h-5 w-5 text-red-600" />
  return <FileText className="h-5 w-5 text-[#246392]" />
}

export default function BatchQuestionBulkUploadModal({
  open,
  onClose,
  files = [],
  onFilesChange,
  onImportComplete,
}) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [queue, setQueue] = useState([])

  const processOne = async (file, fileId) => {
    setQueue((q) =>
      q.map((item) =>
        item.id === fileId ? { ...item, status: 'processing', progress: 5 } : item,
      ),
    )

    try {
      const result = await parseQuestionBulkFile(file, {
        onProgress: (pct) => {
          setQueue((q) =>
            q.map((item) => (item.id === fileId ? { ...item, progress: pct } : item)),
          )
        },
      })

      const meta = {
        ...result.metadata,
        status: result.metadata.status || (result.questions.length ? 'success' : 'warning'),
      }

      setQueue((q) =>
        q.map((item) =>
          item.id === fileId
            ? {
                ...item,
                status: meta.status,
                progress: 100,
                metadata: meta,
                questions: result.questions,
                error: meta.error,
              }
            : item,
        ),
      )

      return result
    } catch (err) {
      setQueue((q) =>
        q.map((item) =>
          item.id === fileId
            ? { ...item, status: 'error', progress: 0, error: err.message }
            : item,
        ),
      )
      return { questions: [], metadata: { status: 'error', error: err.message } }
    }
  }

  const runUpload = async (fileList) => {
    const list = [...fileList]
    if (!list.length) return
    if (files.length + list.length > MAX_BULK_FILES) {
      toast.error(`Maximum ${MAX_BULK_FILES} files per batch`)
      return
    }

    const entries = list.map((file) => ({
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      fileName: file.name,
      fileSize: file.size,
      status: 'pending',
      progress: 0,
    }))

    setQueue((q) => [...q, ...entries])

    const allQuestions = []
    const allMeta = [...files]

    for (const entry of entries) {
      const check = validateUploadFileSync(entry.file, 'EXAM_BULK_DOCUMENTS')
      if (!check.valid) {
        toast.error(check.message)
        setQueue((q) => q.filter((x) => x.id !== entry.id))
        continue
      }
      const ext = getFileExtension(entry.file.name)
      if (!isSupportedBulkExtension(ext)) {
        toast.error(`Unsupported: ${entry.file.name}`)
        setQueue((q) => q.filter((x) => x.id !== entry.id))
        continue
      }
      if (entry.file.size > MAX_BULK_FILE_BYTES) {
        toast.error(`${entry.file.name} is too large`)
        setQueue((q) => q.filter((x) => x.id !== entry.id))
        continue
      }

      const result = await processOne(entry.file, entry.id)
      if (result.metadata) allMeta.push(result.metadata)
      if (result.questions?.length) allQuestions.push(...result.questions)
    }

    onFilesChange?.(allMeta)

    if (allQuestions.length) {
      onImportComplete?.(allQuestions)
    } else {
      toast.message('Upload finished — no questions could be parsed')
    }
  }

  const retryFile = async (entry) => {
    if (!entry.file) return
    await processOne(entry.file, entry.id)
    const refreshed = queue.find((x) => x.id === entry.id)
    if (refreshed?.questions?.length) {
      onImportComplete?.(refreshed.questions)
      toast.success('Retry successful')
    }
  }

  const removeQueued = (id) => setQueue((q) => q.filter((x) => x.id !== id))

  const handleClose = () => {
    setQueue([])
    onClose?.()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      size="xl"
      title="Bulk Upload Questions"
      showCloseButton={false}
    >
      <div className="overflow-hidden rounded-2xl bg-[#f7f9fc] shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        <ModalPanelHeader
          title="Bulk Upload Questions"
          onClose={handleClose}
          closeVariant="icon"
        />

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              runUpload(e.dataTransfer.files)
            }}
            className={cn(
              'rounded-2xl border-2 border-dashed px-6 py-10 text-center transition',
              dragOver ? 'border-[#55ace7] bg-[#eef6fc]' : 'border-[#cfe8f7] bg-white',
            )}
          >
            <Upload className="mx-auto h-10 w-10 text-[#55ace7]" />
            <p className="mt-3 text-base font-semibold text-[#1a3a5c]">
              Drag & drop files here
            </p>
            <UploadFieldHint profile="EXAM_BULK_DOCUMENTS" className="mt-1 text-sm text-[#686868]" />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-5 rounded-full bg-gradient-to-r from-[#55ace7] to-[#246392] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-105"
            >
              Browse Files
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={BULK_UPLOAD_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                runUpload(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {queue.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#246392]">
                Upload queue
              </p>
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {queue.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-[#eef2fc] bg-white px-4 py-3 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {item.status === 'processing' ? (
                        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#55ace7]" />
                      ) : (
                        statusIcon(item.status)
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#111]">
                          {item.fileName}
                        </p>
                        <p className="text-xs text-[#686868]">
                          {formatBytes(item.fileSize)}
                          {item.metadata?.questionCount != null
                            ? ` · ${item.metadata.questionCount} questions`
                            : ''}
                          {item.error ? ` · ${item.error}` : ''}
                          {item.metadata?.note ? ` · ${item.metadata.note}` : ''}
                        </p>
                        {item.status === 'processing' ? (
                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8f4fc]">
                            <div
                              className="h-full rounded-full bg-[#55ace7] transition-all"
                              style={{ width: `${item.progress || 0}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        {item.status === 'error' ? (
                          <button
                            type="button"
                            onClick={() => retryFile(item)}
                            className="rounded-lg p-1.5 text-[#246392] hover:bg-[#eef2fc]"
                            aria-label="Retry"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removeQueued(item.id)}
                          className="rounded-lg p-1.5 text-[#686868] hover:bg-[#eef2fc]"
                          aria-label="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {files.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#246392]">
                Saved uploads ({files.length})
              </p>
              <ul className="max-h-40 space-y-2 overflow-y-auto">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-3 rounded-lg border border-[#eef2fc] bg-white px-3 py-2 text-sm"
                  >
                    {statusIcon(f.status)}
                    <span className="min-w-0 flex-1 truncate font-medium">{f.fileName}</span>
                    <span className="text-xs text-[#686868]">{f.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <footer className="flex justify-end gap-3 border-t border-[#eef2fc] bg-white px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-[#cfe8f7] px-6 py-2.5 text-sm font-semibold text-[#246392] hover:bg-[#eef6fc]"
          >
            Done
          </button>
        </footer>
      </div>
    </Modal>
  )
}
