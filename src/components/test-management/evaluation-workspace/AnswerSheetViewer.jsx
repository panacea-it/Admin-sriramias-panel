import { useRef, useState } from 'react'
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
import { getTestMeta } from '../../../api/evaluationOversightAPI'
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

  const testMeta = getTestMeta(paper?.testId)
  const questionText = testMeta?.questionText || paper?.questionText
  const questionMarks = testMeta?.questionMarks || paper?.questionMarks || 15
  const title = `${paper?.subjectName || 'Subject'} – ${paper?.testName || 'Test'}`

  const file = paper?.answerSheet?.dataUrl
    ? { dataUrl: paper.answerSheet.dataUrl }
    : paper?.answerSheet?.url
      ? { url: paper.answerSheet.url }
      : null

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
          {file ? (
            <PdfViewer
              file={file}
              page={page}
              scale={scale}
              onPageCount={onPageCount}
              className="shadow-lg"
            />
          ) : (
            <div className="flex min-h-[360px] w-full max-w-2xl flex-col items-center justify-center rounded-lg bg-white p-8 text-center shadow-inner ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-600">Answer sheet preview</p>
              <p className="mt-2 max-w-md text-xs text-slate-500">
                Upload or attach a scanned PDF to evaluate. Demo mode shows placeholder layout for{' '}
                {paper?.studentName}.
              </p>
              <div
                className="mt-6 w-full rounded-lg bg-amber-50/80 p-6 text-left text-sm leading-loose text-slate-700"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <p className="text-slate-500">[Handwritten response area — page {page}]</p>
                <p className="mt-4">
                  Digital transformation has reshaped rural administrative structures through e-governance
                  initiatives…
                </p>
                <p className="mt-3 bg-yellow-200/60 px-1">Highlighted section example for evaluation.</p>
              </div>
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
          <button
            type="button"
            onClick={() => onPageChange(clamp(page - 1, 1, Math.max(pageCount || 1, 1)))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[100px] text-center text-xs font-bold tabular-nums">
            Page {String(page).padStart(2, '0')} / {String(pageCount || paper?.answerSheet?.pages || 12).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(clamp(page + 1, 1, Math.max(pageCount || paper?.answerSheet?.pages || 12, 1)))}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
