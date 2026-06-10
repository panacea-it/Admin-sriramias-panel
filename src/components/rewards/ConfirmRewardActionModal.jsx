import RewardsModalShell, {
  RewardsModalCancelButton,
  RewardsModalDangerButton,
  RewardsModalPrimaryButton,
} from './RewardsModalShell'

export default function ConfirmRewardActionModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  loading,
  onCancel,
  onConfirm,
  variant = 'primary',
}) {
  const ConfirmBtn = variant === 'danger' ? RewardsModalDangerButton : RewardsModalPrimaryButton

  return (
    <RewardsModalShell
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <RewardsModalCancelButton onClick={onCancel} disabled={loading} />
          <ConfirmBtn onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </ConfirmBtn>
        </>
      }
    >
      <span className="sr-only">Confirmation</span>
    </RewardsModalShell>
  )
}
