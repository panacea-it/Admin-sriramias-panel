import { useEffect, useState } from 'react'
import { X, FileText, Film } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ContentPreviewModal({ item, onClose }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (item) setLoading(true)
  }, [item])

  if (!item) return null

  const file = item.files?.[0]
  const isVideo =
    item.contentType === 'Video' ||
    item.contentType === 'Recording' ||
    item.contentType === 'YouTube' ||
    item.contentType === 'Vimeo'
  const isPdf = item.contentType === 'PDF'
  const external = item.externalUrl

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-[#1a3a5c]">{item.title}</h2>
              <p className="text-sm text-slate-500">{item.contentType} preview</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="min-h-[280px] flex-1 overflow-auto bg-slate-50 p-5">
            {loading && (
              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-[#55ace7]" />
              </div>
            )}
            {isVideo && (external || file?.url) ? (
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                {item.contentType === 'YouTube' && external ? (
                  <iframe
                    title="Preview"
                    src={external.replace('watch?v=', 'embed/')}
                    className="h-full w-full"
                    onLoad={() => setLoading(false)}
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={file?.url || external}
                    controls
                    className="h-full w-full"
                    onLoadedData={() => setLoading(false)}
                  />
                )}
              </div>
            ) : isPdf && file?.url ? (
              <iframe
                title="PDF"
                src={file.url}
                className="h-[420px] w-full rounded-xl border border-slate-200 bg-white"
                onLoad={() => setLoading(false)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                {isVideo ? <Film className="h-12 w-12" /> : <FileText className="h-12 w-12" />}
                <p className="mt-4 text-sm">
                  Preview for {item.contentType} — open file after publish
                </p>
                {file?.name && <p className="mt-1 text-xs">{file.name}</p>}
              </div>
            )}
            {item.description && (
              <p className="mt-4 text-sm text-slate-600">{item.description}</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
