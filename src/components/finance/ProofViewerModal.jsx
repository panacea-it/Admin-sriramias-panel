import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Download,
  ExternalLink,
  FileImage,
  FileText,
  ImageOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { cn } from '../../utils/cn'

const TYPE_LABELS = {
  image: 'Screenshot / Image',
  screenshot: 'Screenshot',
  bank_slip: 'Bank Slip',
  cheque: 'Cheque',
  pdf: 'PDF Document',
}

function ProofTypeBadge({ type, name }) {
  const label = TYPE_LABELS[type] || (name?.toLowerCase().endsWith('.pdf') ? 'PDF Document' : 'Image')
  const Icon = type === 'pdf' || name?.toLowerCase().endsWith('.pdf') ? FileText : FileImage
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#eef2fc] px-2.5 py-1 text-xs font-semibold text-[#246392]">
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  )
}

function ProofSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 w-32 rounded bg-slate-200" />
      <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-100">
        <div className="h-40 w-64 rounded-lg bg-slate-200" />
      </div>
    </div>
  )
}

export function ProofThumbnail({ proof, onClick, className }) {
  const isPdf = proof?.type === 'pdf' || proof?.name?.toLowerCase().endsWith('.pdf')
  const Icon = isPdf ? FileText : FileImage

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg',
        'border border-slate-200 bg-slate-50 transition hover:border-[#55ace7]/50 hover:shadow-sm',
        className,
      )}
      title={`View ${proof?.name || 'proof'}`}
    >
      {proof?.url && !isPdf ? (
        <img src={proof.url} alt="" className="h-full w-full object-cover" />
      ) : (
        <Icon className="h-5 w-5 text-[#246392] transition group-hover:scale-110" />
      )}
      <span className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-lg" aria-hidden />
    </button>
  )
}

export default function ProofViewerModal({
  open,
  onClose,
  title = 'Payment proof',
  proofUrl,
  proofName,
  proofFiles = [],
  utr,
  notes,
  row,
}) {
  const files = useMemo(() => {
    if (proofFiles?.length) return proofFiles
    if (proofName || proofUrl) {
      return [{ id: 'single', name: proofName, url: proofUrl, type: proofName?.endsWith('.pdf') ? 'pdf' : 'image' }]
    }
    return []
  }, [proofFiles, proofName, proofUrl])

  const [activeIndex, setActiveIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const active = files[activeIndex]
  const isPdf = active?.type === 'pdf' || active?.name?.toLowerCase().endsWith('.pdf')
  const hasPreview = Boolean(active?.url) && !loadError

  useEffect(() => {
    if (!open) return
    setActiveIndex(0)
    setZoom(1)
    setLoading(true)
    setLoadError(false)
  }, [open, row?.id])

  useEffect(() => {
    setZoom(1)
    setLoading(true)
    setLoadError(false)
  }, [activeIndex, active?.url])

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleResetZoom = () => setZoom(1)

  const downloadUrl = active?.url || null
  const handleDownload = useCallback(() => {
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = active?.name || 'payment-proof'
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }, [downloadUrl, active?.name])

  const handleOpenTab = useCallback(() => {
    if (downloadUrl) window.open(downloadUrl, '_blank', 'noopener,noreferrer')
  }, [downloadUrl])

  return (
    <Modal open={open} onClose={onClose} size="lg" title={title} showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_11px_25px_rgba(15,23,42,0.08)]">
        <ModalPanelHeader title={title} onClose={onClose} closeVariant="icon" plainCloseIcon />
        <div className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {active && <ProofTypeBadge type={active.type} name={active.name} />}
            <div className="flex flex-wrap items-center gap-2">
              {!isPdf && hasPreview && (
                <>
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#444] hover:bg-slate-50"
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-[#444] hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> {Math.round(zoom * 100)}%
                  </button>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-[#444] hover:bg-slate-50"
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleDownload}
                disabled={!downloadUrl}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#246392] hover:bg-[#eef6fc] disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
              <button
                type="button"
                onClick={handleOpenTab}
                disabled={!downloadUrl}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-[#246392] hover:bg-[#eef6fc] disabled:opacity-40"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open in tab
              </button>
            </div>
          </div>

          {utr && (
            <p className="text-sm">
              <span className="font-semibold text-[#333]">UTR / Reference:</span>{' '}
              <span className="font-mono text-[#246392]">{utr}</span>
            </p>
          )}

          {notes && (
            <p className="rounded-lg bg-[#eef2fc] p-3 text-sm text-[#333]">
              <span className="font-semibold">Notes:</span> {notes}
            </p>
          )}

          {files.length > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeIndex === 0}
                onClick={() => setActiveIndex((i) => i - 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
                aria-label="Previous file"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-medium text-[#686868]">
                {activeIndex + 1} / {files.length} — {active?.name}
              </span>
              <button
                type="button"
                disabled={activeIndex >= files.length - 1}
                onClick={() => setActiveIndex((i) => i + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40"
                aria-label="Next file"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="relative flex min-h-[240px] max-h-[60vh] items-center justify-center overflow-auto rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:min-h-[320px]">
            {loading && active?.url && !isPdf && (
              <div className="absolute inset-4 z-[1]">
                <ProofSkeleton />
              </div>
            )}

            {!active ? (
              <div className="flex flex-col items-center gap-2 text-[#686868]">
                <ImageOff className="h-12 w-12 text-slate-400" />
                <p className="text-sm font-medium">No proof uploaded</p>
              </div>
            ) : isPdf ? (
              <div className="flex flex-col items-center gap-3 text-[#686868]">
                <FileText className="h-14 w-14 text-[#246392]" />
                <p className="text-sm font-medium">{active.name || 'Document.pdf'}</p>
                {active.url ? (
                  <iframe
                    title={active.name}
                    src={active.url}
                    className="h-[50vh] w-full max-w-2xl rounded-lg border border-slate-200 bg-white"
                    onLoad={() => setLoading(false)}
                  />
                ) : (
                  <p className="text-xs text-center max-w-sm">
                    PDF preview available when API provides file URL. Use Download or Open in tab when linked.
                  </p>
                )}
              </div>
            ) : active.url && !loadError ? (
              <img
                src={active.url}
                alt={active.name || 'Payment proof'}
                style={{ transform: `scale(${zoom})` }}
                className="max-h-[55vh] rounded-lg object-contain transition-transform duration-200 ease-out"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false)
                  setLoadError(true)
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#686868]">
                <ImageOff className="h-12 w-12 text-[#246392]/60" />
                <p className="text-sm font-medium">{active.name || 'proof-image.jpg'}</p>
                <p className="text-xs text-center max-w-xs">
                  Preview unavailable — file metadata stored. Full preview when upload URL is available.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
