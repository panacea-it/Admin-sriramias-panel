import { Plus, Trash2 } from 'lucide-react'
import { CourseInput } from '../../courses/CourseFormField'
import { cn } from '../../../utils/cn'

export default function OptionField({
  option,
  checked,
  optionType,
  onTextChange,
  onToggleCorrect,
  onRemove,
  canRemove,
  disabled,
}) {
  const inputId = `opt-${option.id}`

  return (
    <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-3">
      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#111]"
      >
        <input
          type={optionType === 'multiple' ? 'checkbox' : 'radio'}
          name={optionType === 'single' ? `correct-${option.questionId || 'q'}` : undefined}
          checked={checked}
          disabled={disabled}
          onChange={() => onToggleCorrect(option.id)}
          className="h-4 w-4 accent-[#246392]"
        />
        <span className="text-[#246392]">{option.label}</span>
      </label>
      <CourseInput
        id={inputId}
        value={option.text}
        disabled={disabled}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={`Enter Option ${option.label}`}
      />
      {canRemove ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onRemove}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 disabled:opacity-40"
          aria-label={`Remove option ${option.label}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <span className="hidden sm:block sm:w-10" />
      )}
    </div>
  )
}

export function AddOptionButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-[#55ace7]/35 bg-[#eef6fc] px-4 py-2 text-sm font-semibold text-[#246392] transition',
        'hover:border-[#55ace7] hover:bg-white disabled:opacity-50',
      )}
    >
      <Plus className="h-4 w-4" />
      Add Option
    </button>
  )
}
