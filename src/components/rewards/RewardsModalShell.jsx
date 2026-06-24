import { Loader2 } from 'lucide-react'
import AdminFormModalShell from '../admin/AdminFormModalShell'
import FormModalSubmitBar from '../common/FormModalSubmitBar'
import { CourseFormField } from '../courses/CourseFormField'
import { cn } from '../../utils/cn'
import {
  ADMIN_FORM_FIELD_GAP,
  ADMIN_FORM_SECTION_DIVIDER,
  ADMIN_FORM_SECTION_TITLE,
} from '../../utils/adminUiStandards'
import {
  rewardsModalPrimaryBtnClass,
  rewardsModalSecondaryBtnClass,
  rewardsModalDangerBtnClass,
} from './rewardsModalUi'

export default function RewardsModalShell({
  open,
  onClose,
  title,
  children,
  footer,
  description,
  icon,
  iconClassName,
  size = 'md',
  maxHeightClass,
}) {
  return (
    <AdminFormModalShell
      open={open}
      onClose={onClose}
      title={title}
      subtitle={description}
      icon={icon}
      iconClassName={iconClassName}
      size={size}
      maxHeightClass={maxHeightClass}
      footer={footer}
    >
      {children}
    </AdminFormModalShell>
  )
}

export function RewardsModalField({ label, error, hint, children, htmlFor, required }) {
  return (
    <CourseFormField label={label} required={required}>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      {!error && hint && <p className="text-xs text-[#686868]">{hint}</p>}
    </CourseFormField>
  )
}

export function RewardsFormSection({ title, description, children, className }) {
  return (
    <section className={cn(ADMIN_FORM_FIELD_GAP, className)}>
      <div className={ADMIN_FORM_SECTION_DIVIDER}>
        <h3 className={ADMIN_FORM_SECTION_TITLE}>{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-[#686868]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

export function RewardsModalCancelButton({ onClick, disabled, children = 'Cancel' }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={rewardsModalSecondaryBtnClass}>
      {children}
    </button>
  )
}

export function RewardsModalPrimaryButton({
  type = 'button',
  form,
  onClick,
  disabled,
  loading,
  children,
}) {
  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      className={rewardsModalPrimaryBtnClass}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait…
        </>
      ) : (
        children
      )}
    </button>
  )
}

export function RewardsModalDangerButton({ onClick, disabled, loading, children }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || loading} className={rewardsModalDangerBtnClass}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Please wait…
        </>
      ) : (
        children
      )}
    </button>
  )
}

/** Form modal footer with Reset + Submit — matches Add User dialog */
export function RewardsFormModalFooter({
  isEditMode,
  onReset,
  isSubmitting,
  disableSubmit,
  disableReset,
  createLabel = 'Create',
  updateLabel = 'Update',
  resetLabel = 'Reset',
  loadingLabel = 'Saving…',
  form,
}) {
  return (
    <FormModalSubmitBar
      isEditMode={isEditMode}
      onReset={onReset}
      isSubmitting={isSubmitting}
      disableSubmit={disableSubmit}
      disableReset={disableReset}
      createLabel={createLabel}
      updateLabel={updateLabel}
      resetLabel={resetLabel}
      loadingLabel={loadingLabel}
      form={form}
    />
  )
}
