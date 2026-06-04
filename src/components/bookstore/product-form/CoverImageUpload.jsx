import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageIcon, RefreshCw, Upload, X } from 'lucide-react'
import { cn } from '../../../utils/cn'
import { createCoverAsset } from '../../../utils/bookstoreProductForm'
import { UploadFieldHint, UploadValidationMessage } from '../../common/UploadFieldHint'
import { UPLOAD_PROFILES } from '../../../constants/uploadConstraints'
import { validateUploadFile } from '../../../utils/uploadValidation'
import { BOOKSTORE_ERROR_CLASS, BOOKSTORE_HELPER_CLASS } from '../modal/bookstoreFormStyles'

const COVER_PROFILE = UPLOAD_PROFILES.IMAGE_STANDARD

export default function CoverImageUpload({ value, onChange, onUploadStart, error }) {
  const inputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [validationError, setValidationError] = useState(null)

  const applyFile = async (file) => {
    if (!file) return
    const result = await validateUploadFile(file, COVER_PROFILE)
    if (!result.valid) {
      setValidationError(result.message)
      return
    }
    setValidationError(null)
    const asset = createCoverAsset(file)
    onChange(asset)
    onUploadStart?.([asset.id])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (e.dataTransfer.files?.length > 1) return
    applyFile(file)
  }

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative overflow-hidden rounded-2xl border-2 border-dashed transition duration-200',
          dragOver
            ? 'border-[#7c5cbf] bg-[#f3f0fa] shadow-inner'
            : 'border-[#d8dce3] bg-[#fafbff] hover:border-[#7c5cbf]/50 hover:bg-[#f7f5fc]',
          error && 'border-red-300 bg-red-50/40',
        )}
      >
        <AnimatePresence mode="wait">
          {value?.previewUrl ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative flex min-h-[220px] flex-col items-center justify-center gap-4 p-8"
            >
              <img
                src={value.previewUrl}
                alt="Book cover preview"
                className="max-h-56 max-w-full rounded-xl object-contain shadow-lg ring-1 ring-[#e8ecf2]"
              />
              {value.uploading && (
                <div className="absolute inset-x-8 bottom-6">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#e8ecf2]">
                    <motion.div
                      className="h-full rounded-full bg-[#7c5cbf]"
                      initial={{ width: 0 }}
                      animate={{ width: `${value.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-center text-xs font-medium text-[#686868]">
                    Uploading… {Math.round(value.progress)}%
                  </p>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#d8dce3] bg-white px-3 py-2 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-[#f7f7f9]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Change cover
                </button>
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="dropzone"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => inputRef.current?.click()}
              className="flex min-h-[220px] w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center transition"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ede8f8]">
                <Upload className="h-8 w-8 text-[#7c5cbf]" strokeWidth={1.8} />
              </span>
              <span className="text-base font-semibold text-[#3d2d6b]">Drop cover image here</span>
              <span className="max-w-md text-sm text-[#686868]">or click to browse</span>
              <span className="text-xs font-medium text-[#9ca0a8]">Single image only</span>
            </motion.button>
          )}
        </AnimatePresence>
        <input
          ref={inputRef}
          type="file"
          accept={COVER_PROFILE.accept}
          className="sr-only"
          onChange={(e) => {
            applyFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      {value?.fileName && (
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#5a4a8a]">
          <ImageIcon className="h-4 w-4 shrink-0" />
          {value.fileName}
        </p>
      )}
      <UploadFieldHint profile={COVER_PROFILE} className={BOOKSTORE_HELPER_CLASS} />
      <p className={BOOKSTORE_HELPER_CLASS}>Only one cover thumbnail is allowed. Replacing uploads overwrites the previous image.</p>
      <UploadValidationMessage message={validationError} className={BOOKSTORE_ERROR_CLASS} />
      {error && <p className={BOOKSTORE_ERROR_CLASS}>{error}</p>}
    </div>
  )
}
