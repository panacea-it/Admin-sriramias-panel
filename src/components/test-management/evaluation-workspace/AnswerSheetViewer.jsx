import { useEffect, useRef, useState } from 'react'
import {
  Highlighter,
  MessageSquare,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react'
import PdfViewer from '../../evaluation-management/PdfViewer'
import { fetchSubmissionPdfBlobUrl } from '../../../api/evaluationOversightAPI'
import { cn } from '../../../utils/cn'

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

export default function AnswerSheetViewer({
  paper,
  page,
  pageCount,
  scale,
  rotation,
  activeTool,
  annotations,
  locked,
  downloading = false,
  onDownload,
  onPageChange,
  onScaleChange,
  onRotate,
  onToolChange,
  onPageCount,
  onAnnotate,
}) {
  const wrapRef = useRef(null)
  const [drag, setDrag] = useState(null)
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(null)

  const questionText = paper?.questionText
  const questionMarks = paper?.questionMarks || 15
  const title = `${paper?.subjectName || 'Subject'} – ${paper?.testName || 'Test'}`

  const sheetUrl = paper?.answerSheet?.dataUrl || paper?.answerSheet?.url || null
  const isTextAnswer =
    paper?.answerType === 'text' ||
    (!sheetUrl && Boolean(String(paper?.answerText || '').trim()))
  const isDataUrl = Boolean(paper?.answerSheet?.dataUrl)
  const isFileAnswer = paper?.answerType === 'file' || Boolean(sheetUrl && !isTextAnswer)

  useEffect(() => {
    let cancelled = false
    let objectUrl = null

    async function loadPdf() {
      setPdfBlobUrl(null)
      setPdfError(null)

      if (isTextAnswer || !isFileAnswer) return

      if (isDataUrl) {
        setPdfBlobUrl(paper.answerSheet.dataUrl)
        return
      }

      if (!paper?.id) return

      setPdfLoading(true)
      try {
        objectUrl = await fetchSubmissionPdfBlobUrl(paper.id)
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        setPdfBlobUrl(objectUrl)
      } catch (err) {
        if (!cancelled) {
          setPdfError(err?.message || 'Unable to load answer PDF')
        }
      } finally {
        if (!cancelled) setPdfLoading(false)
      }
    }

    loadPdf()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [paper?.id, isTextAnswer, isFileAnswer, isDataUrl, paper?.answerSheet?.dataUrl])

  const pdfJsFile = pdfBlobUrl ? { url: pdfBlobUrl } : null

  const pageAnnotations = (annotations || []).filter((a) => Number(a.page) === Number(page))

  const getPoint = (e) => {
    const el = wrapRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    return {
      x: clamp((e.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((e.clientY - rect.top) / rect.height, 0, 1),
    }
  }

  const handleMouseDown = (e) => {
    if (locked || activeTool !== 'highlight') return
    const p = getPoint(e)
    if (p) setDrag({ start: p, end: p })
  }

  const handleMouseMove = (e) => {
    if (!drag) return
    const p = getPoint(e)
    if (p) setDrag((d) => ({ ...d, end: p }))
  }

  const handleMouseUp = () => {
    if (!drag) return
    const { start, end } = drag
    setDrag(null)
    const x1 = Math.min(start.x, end.x)
    const y1 = Math.min(start.y, end.y)
    const w = Math.abs(end.x - start.x)
    const h = Math.abs(end.y - start.y)
    if (w < 0.01 && h < 0.01) return
    onAnnotate?.({
      tool: 'highlight',
      page,
      rect: { x: x1, y: y1, w, h },
      color: 'rgba(245,158,11,0.4)',
    })
  }

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-white shadow-[var(--card-shadow)]">
      <div className="border-b border-slate-100 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[#1a3a5c] sm:text-lg">{title}</h2>
            {questionText && (
              <div className="mt-3 border-l-4 border-[#55ace7] pl-3">
                <p className="text-xs font-semibold text-slate-500">Question 1</p>
                <p className="mt-1 text-sm leading-relaxed text-[#333]">
                  {questionText}{' '}
                  <span className="font-semibold text-slate-500">({questionMarks} Marks)</span>
                </p>
              </div>
            )}
          </div>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={downloading}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className={cn('h-4 w-4', downloading && 'animate-pulse')} />
              {downloading ? 'Downloading…' : 'Download'}
            </button>
          )}
        </div>
      </div>

      <div className="relative flex min-h-[420px] flex-1 flex-col bg-slate-100/80 p-3 sm:min-h-[520px]">
        <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white px-2 py-1.5 shadow-md ring-1 ring-slate-200">
          <button
            type="button"
            title="Highlight"
            onClick={() => onToolChange?.('highlight')}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-full transition',
              activeTool === 'highlight' ? 'bg-[#55ace7] text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <Highlighter className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Comment"
            onClick={() => onToolChange?.('comment')}
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-full transition',
              activeTool === 'comment' ? 'bg-[#55ace7] text-white' : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-slate-200" />
          <button
            type="button"
            title="Rotate"
            onClick={onRotate}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Zoom out"
            onClick={() => onScaleChange(clamp(scale - 0.1, 0.6, 2))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Zoom in"
            onClick={() => onScaleChange(clamp(scale + 0.1, 0.6, 2))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={wrapRef}
          className="relative mx-auto mt-10 flex w-full max-w-3xl flex-1 items-start justify-center overflow-auto"
          style={{ transform: `rotate(${rotation}deg)` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {isTextAnswer ? (
            <div className="flex min-h-[360px] w-full max-w-2xl flex-col rounded-lg bg-white p-6 shadow-inner ring-1 ring-slate-200">
              <p className="text-xs font-bold uppercase tracking-wide text-[#55ace7]">
                Typed answer
              </p>
              <div
                className="mt-4 max-h-[min(520px,60vh)] flex-1 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-800"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {paper?.answerText || 'No answer text submitted.'}
              </div>
            </div>
          ) : pdfLoading ? (
            <div className="flex min-h-[360px] w-full max-w-2xl items-center justify-center rounded-lg bg-white p-8 shadow-inner ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-600">Loading answer PDF…</p>
            </div>
          ) : pdfError ? (
            <div className="flex min-h-[360px] w-full max-w-2xl flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-inner ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-red-700">{pdfError}</p>
              {sheetUrl ? (
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-sm font-semibold text-[#55ace7] hover:underline"
                >
                  Open original file in new tab
                </a>
              ) : null}
            </div>
          ) : pdfJsFile ? (
            <PdfViewer
              file={pdfJsFile}
              page={page}
              scale={scale}
              onPageCount={onPageCount}
              className="shadow-lg"
            />
          ) : (
            <div className="flex min-h-[360px] w-full max-w-2xl flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-inner ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-600">No answer sheet attached</p>
              <p className="mt-2 max-w-md text-xs text-slate-500">
                This submission does not include a PDF or typed answer to preview.
              </p>
            </div>
          )}

          <div className="pointer-events-none absolute inset-0">
            {pageAnnotations.map((a) =>
              a.rect ? (
                <div
                  key={a.id}
                  className="absolute rounded-sm"
                  style={{
                    left: `${a.rect.x * 100}%`,
                    top: `${a.rect.y * 100}%`,
                    width: `${a.rect.w * 100}%`,
                    height: `${a.rect.h * 100}%`,
                    background: a.color || 'rgba(245,158,11,0.35)',
                  }}
                />
              ) : null,
            )}
            {drag ? (
              <div
                className="absolute rounded-sm bg-amber-300/30 ring-2 ring-amber-400/50"
                style={{
                  left: `${Math.min(drag.start.x, drag.end.x) * 100}%`,
                  top: `${Math.min(drag.start.y, drag.end.y) * 100}%`,
                  width: `${Math.abs(drag.end.x - drag.start.x) * 100}%`,
                  height: `${Math.abs(drag.end.y - drag.start.y) * 100}%`,
                }}
              />
            ) : null}
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1a3a5c] px-3 py-2 text-white shadow-lg">
          {isTextAnswer ? (
            <span className="min-w-[100px] text-center text-xs font-bold">Typed answer</span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onPageChange(clamp(page - 1, 1, Math.max(pageCount || 1, 1)))}
                disabled={pdfLoading || !pdfJsFile}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[100px] text-center text-xs font-bold tabular-nums">
                {pdfLoading
                  ? 'Loading…'
                  : `Page ${String(page).padStart(2, '0')} / ${String(pageCount || 1).padStart(2, '0')}`}
              </span>
              <button
                type="button"
                onClick={() =>
                  onPageChange(clamp(page + 1, 1, Math.max(pageCount || 1, 1)))
                }
                disabled={pdfLoading || !pdfJsFile}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
