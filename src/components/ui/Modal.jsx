import AppModalWrapper from './AppModalWrapper'

export default function Modal({
  open,
  onClose,
  children,
  className,
  size = 'lg',
  title = 'Dialog',
  showCloseButton = true,
  zIndex,
}) {
  return (
    <AppModalWrapper
      open={open}
      onClose={onClose}
      className={className}
      size={size}
      title={title}
      showCloseButton={showCloseButton}
      zIndex={zIndex}
    >
      {children}
    </AppModalWrapper>
  )
}
