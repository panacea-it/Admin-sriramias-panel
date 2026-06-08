import { motion } from 'framer-motion'
import CategoryBreadcrumb from '../categories/CategoryBreadcrumb'

export default function LiveClassesPageShell({ breadcrumb, banner, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6"
    >
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        {breadcrumb?.length > 0 && <CategoryBreadcrumb items={breadcrumb} />}
        {banner}
        {children}
      </section>
    </motion.div>
  )
}
