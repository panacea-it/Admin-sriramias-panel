import { cn } from '../../../../utils/cn'
import { CBT_PANEL_CLASS } from './cbtUiConstants'

/** White card wrapper for CBT list tables (Tests page layout) */
export default function CbtTableCard({ children, toolbar, className, bodyClassName }) {
  return (
    <section className={cn(CBT_PANEL_CLASS, className)}>
      {toolbar ? (
        <div className="mb-4 flex items-center justify-end">{toolbar}</div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}
