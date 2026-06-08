import { useCallback, useRef, useState } from 'react'
import { AlertCircle, FileText, Image as ImageIcon, RefreshCw, Upload, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import {
  FINANCE_PROOF_ALLOWED_EXTENSIONS,
  FINANCE_PROOF_ALLOWED_TYPES,
  FINANCE_PROOF_MAX_SIZE_MB,
} from '../../constants/financeVerification'

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function validateFile(file, maxSizeMb = FINANCE_PROOF_MAX_SIZE_MB) {
  const ext = `.${file.name.split('.').pop()?.toLowerCase()}`
  if (!FINANCE_PROOF_ALLOWED_TYPES.includes(file.type) && !FINANCE_PROOF_ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Unsupported file type. Allowed: JPG, PNG, PDF'
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    return `File exceeds ${maxSizeMb} MB limit`
  }
  return null
}

export default function OfflineProofDropzone({
  files = [],
  onChange,
  maxSizeMb = FINANCE_PROOF_MAX_SIZE_MB,
  label = 'Upload proof',
  multiple = true,
  disabled = false,
}) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({})
  const [errors, setErrors] = useState({})

  const simulateUpload = useCallback(
    (file, id) => {
      setUploadProgress((p) => ({ ...p, [id]: 0 }))
      let progress = 0
      const interval = setInterval(() => {
        progress += 20
        setUploadProgress((p) => ({ ...p, [id]: Math.min(progress, 100) }))
        if (progress >= 100) clearInterval(interval)
      }, 120)
    },
    [],
  )

  const addFiles = useCallback(
    (incoming) => {
      const list = Array.from(incoming)
      const next = [...files]
      const newErrors = { ...errors }

      list.forEach((file) => {
        const err = validateFile(file, maxSizeMb)
        const id = `${file.name}-${file.size}-${Date.now()}`
        if (err) {
          newErrors[id] = err
          return
        }
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : null
        next.push({ id, file, name: file.name, preview, size: file.size })
        simulateUpload(file, id)
      })

      setErrors(newErrors)
      onChange?.(next)
    },
    [files, errors, maxSizeMb, onChange, simulateUpload],
  )

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    addFiles(e.dataTransfer.files)
  }

  const removeFile = (id) => {
    onChange?.(files.filter((f) => f.id !== id))
    setUploadProgress((p) => {
      const next = { ...p }
      delete next[id]
      return next
    })
  }

  const retryFile = (item) => {
    setErrors((e) => {
      const next = { ...e }
      delete next[item.id]
      return next
    })
    simulateUpload(item.file, item.id)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-[#333]">{label}</p>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-xl border-2 border-dashed p-6 text-center transition',
          dragOver ? 'border-[#55ace7] bg-[#eef6fc]' : 'border-slate-200 bg-white',
          disabled && 'opacity-60',
        )}
      >
        <Upload className="mx-auto h-8 w-8 text-[#246392]/70" />
        <p className="mt-2 text-sm font-semibold text-[#222]">Drag & drop files here</p>
        <p className="mt-1 text-xs text-[#686868]">
          JPG, PNG, PDF · Max {maxSizeMb} MB {multiple ? '· Multiple files supported' : ''}
        </p>
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="mt-3 inline-flex h-9 items-center rounded-lg bg-[#246392] px-4 text-xs font-semibold text-white hover:bg-[#1a4d73] disabled:opacity-60"
        >
          Browse files
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={FINANCE_PROOF_ALLOWED_EXTENSIONS.join(',')}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {Object.entries(errors).map(([id, msg]) => (
        <p key={id} className="flex items-center gap-1.5 text-xs font-medium text-[#df8284]">
          <AlertCircle className="h-3.5 w-3.5" /> {msg}
        </p>
      ))}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((item) => {
            const isPdf = item.name?.toLowerCase().endsWith('.pdf')
            const progress = uploadProgress[item.id] ?? 100
            const Icon = isPdf ? FileText : ImageIcon
            return (
              <li
                key={item.id}
                className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                  {item.preview ? (
                    <img src={item.preview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-5 w-5 text-[#246392]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#222]">{item.name}</p>
                  <p className="text-xs text-[#686868]">{formatBytes(item.size)}</p>
                  {progress < 100 && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-[#55ace7] transition-all duration-200"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#df8284] hover:bg-white"
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {progress < 100 && (
                    <button
                      type="button"
                      onClick={() => retryFile(item)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#246392] hover:bg-white"
                      aria-label="Retry upload"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
