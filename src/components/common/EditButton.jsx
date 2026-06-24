import { Edit3 } from 'lucide-react'
import IconActionButton from './IconActionButton'
import { cn } from '../../utils/cn'

export default function EditButton({ onClick, className, label = 'Edit', disabled = false }) {
  return (
    <IconActionButton
      label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm',
        className,
      )}
    >
      <Edit3 className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden="true" />
    </IconActionButton>
  )
}
