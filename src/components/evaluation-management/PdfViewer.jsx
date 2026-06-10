import { useEffect, useMemo, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// pdfjs worker for Vite/ESM
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

export default function PdfViewer({
  file,
  page = 1,
  scale = 1.1,
  onPageCount,
  onRender,
  className,
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [pdf, setPdf] = useState(null)
  const [rendering, setRendering] = useState(false)
  const source = useMemo(() => {
    if (!file) return null
    if (typeof file === 'string') return { url: file }
    if (file?.dataUrl && typeof file.dataUrl === 'string') return { url: file.dataUrl }
    if (file?.url && typeof file.url === 'string') return { url: file.url }
    return null
  }, [file])

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!source?.url) {
        setPdf(null)
        onPageCount?.(0)
        return
      }
      try {
        const task = pdfjsLib.getDocument(source)
        const loaded = await task.promise
        if (cancelled) return
        setPdf(loaded)
        onPageCount?.(loaded.numPages || 0)
      } catch {
        if (cancelled) return
        setPdf(null)
        onPageCount?.(0)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [source?.url, onPageCount])

  useEffect(() => {
    let cancelled = false
    async function render() {
      if (!pdf || !canvasRef.current) return
      const p = Math.min(Math.max(1, Number(page) || 1), pdf.numPages || 1)
      setRendering(true)
      try {
        const pdfPage = await pdf.getPage(p)
        if (cancelled) return
        const viewport = pdfPage.getViewport({ scale: Number(scale) || 1 })
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d', { alpha: false })
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        const renderTask = pdfPage.render({ canvasContext: ctx, viewport })
        await renderTask.promise
        if (cancelled) return
        onRender?.({ width: canvas.width, height: canvas.height, page: p, scale })
      } finally {
        if (!cancelled) setRendering(false)
      }
    }
    render()
    return () => {
      cancelled = true
    }
  }, [pdf, page, scale, onRender])

  return (
    <div ref={containerRef} className={className}>
      {!source?.url ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6">
          <p className="text-sm font-semibold text-slate-600">Upload or attach a PDF to start evaluation.</p>
        </div>
      ) : (
        <div className="relative overflow-auto rounded-xl border border-slate-200 bg-white">
          <canvas ref={canvasRef} className="mx-auto block" />
          {rendering ? (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-3">
              <span className="rounded-lg bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200">
                Rendering…
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

