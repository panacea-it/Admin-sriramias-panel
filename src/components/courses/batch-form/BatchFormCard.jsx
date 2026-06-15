import { motion } from 'framer-motion'
import { cn } from '../../../utils/cn'

/**
 * Guided card section for Add/Edit Batch — presentation only.
 */
export default function BatchFormCard({
  icon: Icon,
  title,
  description,
  children,
  className,
  step,
  required = false,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'overflow-hidden rounded-2xl border border-[#e5eaf2]/90 bg-white',
        'shadow-[0_8px_28px_rgba(15,23,42,0.06)] ring-1 ring-white/90',
        'transition-shadow duration-300 hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <div className="flex items-start gap-4 border-b border-[#eef2fc] bg-gradient-to-r from-[#f8fbff] via-white to-white px-5 py-4 sm:px-6 sm:py-5">
        {Icon ? (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef6fc] shadow-sm ring-1 ring-[#cfe8f8]/80"
            aria-hidden
          >
            <Icon className="h-5 w-5 text-[#246392]" strokeWidth={2.1} />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {step != null ? (
              <span className="inline-flex rounded-md bg-[#246392]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#246392]">
                Step {step}
              </span>
            ) : null}
            <h3 className="text-base font-bold tracking-tight text-[#1a3a5c] sm:text-lg">
              {title}
              {required ? <span className="text-red-500"> *</span> : null}
            </h3>
          </div>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#686868]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="px-5 py-6 sm:px-6 sm:py-7">{children}</div>
    </motion.section>
  )
}

export const batchFormGrid = 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'
