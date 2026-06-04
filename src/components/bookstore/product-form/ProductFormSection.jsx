import { motion } from 'framer-motion'
import { cn } from '../../../utils/cn'

export default function ProductFormSection({
  title,
  description,
  children,
  className,
  delay = 0,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay }}
      className={cn(
        'rounded-2xl border border-[#e8ecf2] bg-gradient-to-b from-white to-[#fafbfc] p-5 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="mb-5 border-b border-[#eef0f4] pb-4">
        <h3 className="text-base font-bold tracking-tight text-[#111]">{title}</h3>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-[#686868]">{description}</p>
        )}
      </div>
      {children}
    </motion.section>
  )
}
