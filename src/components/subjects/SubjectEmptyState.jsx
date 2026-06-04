import { Layers } from 'lucide-react'

export default function SubjectEmptyState({ title = 'No Faculty Subjects Found', description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-16 text-center shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eef2fc]">
        <Layers className="h-7 w-7 text-[#55ace7]" strokeWidth={2} />
      </div>
      <h3 className="text-lg font-bold text-[#222]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-[#686868]">{description}</p>
      )}
    </div>
  )
}
