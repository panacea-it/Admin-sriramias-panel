import {
  Video,
  Film,
  ClipboardList,
  PenLine,
  FileText,
  Plus,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { CATEGORY_TYPES } from '../../utils/facultySubjectHierarchy'

const EMPTY_CONFIG = {
  [CATEGORY_TYPES.LIVE_CLASS]: {
    icon: Video,
    title: 'No classes yet',
    description: 'Schedule your first live class for this folder.',
    buttonLabel: 'Add Live Class',
  },
  [CATEGORY_TYPES.RECORDED_CLASS]: {
    icon: Film,
    title: 'No recordings yet',
    description: 'Upload a recording to share with students.',
    buttonLabel: 'Add Recording',
  },
  [CATEGORY_TYPES.TEST_SERIES]: {
    icon: ClipboardList,
    title: 'No tests yet',
    description: 'Configure a prelims test series for this folder.',
    buttonLabel: 'Add Prelims Test',
  },
  [CATEGORY_TYPES.MAINS_ANSWER_WRITING]: {
    icon: PenLine,
    title: 'No assignments yet',
    description: 'Create a mains answer writing assignment.',
    buttonLabel: 'Add Mains Answer Writing',
  },
  [CATEGORY_TYPES.PDFS]: {
    icon: FileText,
    title: 'No PDFs yet',
    description: 'Upload study material as a PDF document.',
    buttonLabel: 'Add PDF',
  },
}

export default function ContentEmptyState({ categoryType, onAdd, className }) {
  const config = EMPTY_CONFIG[categoryType] || {
    icon: FileText,
    title: 'No items yet',
    description: 'Get started by adding your first entry.',
    buttonLabel: 'Add Item',
  }
  const Icon = config.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 px-6 py-14 text-center',
        className,
      )}
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#eef2fc] to-[#d1e9f6] shadow-[0_8px_24px_rgba(85,172,231,0.15)]">
        <Icon className="h-9 w-9 text-[#55ace7]" strokeWidth={1.75} />
      </div>
      <h3 className="text-lg font-bold text-[#1a3a5c]">{config.title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">{config.description}</p>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.25)] transition hover:scale-[1.02] hover:shadow-[0_6px_20px_rgba(3,4,94,0.3)] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          {config.buttonLabel}
        </button>
      )}
    </div>
  )
}
