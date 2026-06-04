import { useEffect, useRef, useState } from 'react'
import { Eye, Save, FilePlus, Trash2 } from 'lucide-react'
import BlogRichEditor from '../../blogs/BlogRichEditor'
import { generateContentId } from '../../../utils/facultySubjectContentStorage'
import { cn } from '../../../utils/cn'

export default function NotesTab({ topic, onUpdateTopic }) {
  const notes = topic?.notes || []
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id || null)
  const [previewMode, setPreviewMode] = useState(false)
  const autosaveTimer = useRef(null)

  const activeNote = notes.find((n) => n.id === activeNoteId) || null

  useEffect(() => {
    if (!activeNoteId && notes.length) setActiveNoteId(notes[0].id)
  }, [notes, activeNoteId])

  const updateNote = (patch) => {
    if (!activeNote) return
    const list = notes.map((n) =>
      n.id === activeNote.id
        ? { ...n, ...patch, lastAutosave: new Date().toISOString() }
        : n,
    )
    onUpdateTopic({ notes: list })
  }

  const scheduleAutosave = (content) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      updateNote({ content, status: 'draft' })
    }, 1500)
  }

  const createNote = () => {
    const note = {
      id: generateContentId('note'),
      title: 'Untitled Note',
      content: '',
      status: 'draft',
      attachments: [],
      lastAutosave: null,
      createdAt: new Date().toISOString(),
    }
    onUpdateTopic({ notes: [...notes, note] })
    setActiveNoteId(note.id)
  }

  const deleteNote = (id) => {
    const list = notes.filter((n) => n.id !== id)
    onUpdateTopic({ notes: list })
    if (activeNoteId === id) setActiveNoteId(list[0]?.id || null)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <div className="space-y-2">
        <button
          type="button"
          onClick={createNote}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:border-[#55ace7]"
        >
          <FilePlus className="h-4 w-4" />
          New Note
        </button>
        {notes.map((note) => (
          <div
            key={note.id}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition',
              activeNoteId === note.id
                ? 'border-[#55ace7] bg-[#55ace7]/10 font-semibold text-[#1a3a5c]'
                : 'border-slate-100 hover:bg-slate-50',
            )}
          >
            <button
              type="button"
              onClick={() => setActiveNoteId(note.id)}
              className="min-w-0 flex-1 truncate text-left"
            >
              {note.title}
            </button>
            <button
              type="button"
              onClick={() => deleteNote(note.id)}
              className="shrink-0 text-[#c96565]"
              aria-label="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {notes.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-slate-400">No notes yet</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        {!activeNote ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Create a note to start writing rich content.
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                value={activeNote.title}
                onChange={(e) => updateNote({ title: e.target.value })}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-base font-semibold text-[#1a3a5c]"
              />
              <button
                type="button"
                onClick={() => setPreviewMode((p) => !p)}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
              >
                <Eye className="h-4 w-4" />
                {previewMode ? 'Edit' : 'Preview'}
              </button>
              <button
                type="button"
                onClick={() => updateNote({ status: 'draft' })}
                className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
              >
                <Save className="h-4 w-4" />
                Save Draft
              </button>
            </div>
            {activeNote.lastAutosave && (
              <p className="mb-2 text-xs text-slate-400">
                Autosaved {new Date(activeNote.lastAutosave).toLocaleString()}
              </p>
            )}
            {previewMode ? (
              <div
                className="prose prose-sm max-w-none min-h-[200px] rounded-lg border bg-slate-50 p-4"
                dangerouslySetInnerHTML={{ __html: activeNote.content || '<p>Empty note</p>' }}
              />
            ) : (
              <BlogRichEditor
                value={activeNote.content}
                onChange={(html) => {
                  updateNote({ content: html })
                  scheduleAutosave(html)
                }}
                minHeight={280}
                placeholder="Write notes with headings, bullets, and links…"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
