import { motion, AnimatePresence } from 'framer-motion'
import { List } from 'lucide-react'
import { CourseTextarea } from '../CourseFormField'
import { parsePaymentBullets } from '../../../utils/feeDetailsForm'
import { cn } from '../../../utils/cn'

/**
 * Payment bullet textarea + live preview cards — same parse/output behavior as before.
 */
export default function PaymentBulletsField({
  label,
  placeholder,
  helperText,
  sampleItems,
  value,
  onChange,
}) {
  const bullets = parsePaymentBullets(value)
  const previewItems = bullets.length ? bullets : sampleItems
  const isPlaceholder = bullets.length === 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#eef6fc] ring-1 ring-[#cfe8f8]">
          <List className="h-4 w-4 text-[#246392]" strokeWidth={2.2} />
        </span>
        <label className="text-sm font-semibold text-[#1a3a5c]">{label}</label>
      </div>
      <CourseTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder={placeholder}
        className="min-h-[8rem] resize-y leading-relaxed"
      />
      <p className="text-xs leading-relaxed text-[#686868]">{helperText}</p>
      <div
        className={cn(
          'rounded-xl border p-4 transition-colors duration-200',
          isPlaceholder
            ? 'border-dashed border-[#cfe8f7] bg-[#fafcff]'
            : 'border-[#e5eaf2] bg-gradient-to-b from-[#fafcff] to-white',
        )}
      >
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-[#246392]">
          {isPlaceholder ? 'Preview (example)' : `Preview (${bullets.length} points)`}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {previewItems.map((line, idx) => (
              <motion.li
                key={`${line}-${idx}-${isPlaceholder}`}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={cn(
                  'flex gap-2.5 rounded-lg border px-3 py-2.5 text-sm leading-snug',
                  isPlaceholder
                    ? 'border-[#eef2fc] bg-white/60 text-[#9ca3af]'
                    : 'border-[#eef2fc] bg-white font-medium text-[#333] shadow-sm',
                )}
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                    isPlaceholder
                      ? 'bg-[#eef2fc] text-[#93c5fd]'
                      : 'bg-[#55ace7] text-white',
                  )}
                >
                  {idx + 1}
                </span>
                <span className="min-w-0 flex-1">{line}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>
    </div>
  )
}
