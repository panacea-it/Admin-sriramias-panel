import { BookOpen, X } from 'lucide-react'

export default function FreeLearningResourcePageHeader({ title, subtitle, onClose }) {
  return (
    <header className="z-10 flex shrink-0 items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-[#55ace7] via-[#4a9fd8] to-[#1a4d73] px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
          <BookOpen className="h-5 w-5 text-[#246392]" strokeWidth={2.4} />
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-white sm:text-xl">{title}</h1>
          <p className="mt-0.5 text-sm font-medium text-white/85">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
      >
        <X className="h-5 w-5" strokeWidth={2.25} />
      </button>
    </header>
  )
}
