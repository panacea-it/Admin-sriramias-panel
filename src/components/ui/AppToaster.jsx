import { Toaster } from 'sonner'
import { TOAST_DURATION } from '../../utils/toast'

/**
 * Global toast host — pairs with `src/utils/toast.js` for consistent UX.
 * Auto-dismiss, pause-on-hover, stacking, and progress timer are styled in index.css.
 */
export default function AppToaster() {
  return (
    <Toaster
      className="app-toaster"
      theme="light"
      position="top-right"
      closeButton
      expand
      visibleToasts={5}
      gap={10}
      offset={{ top: 20, right: 20, left: 16, bottom: 16 }}
      pauseWhenPageIsHidden
      toastOptions={{
        duration: TOAST_DURATION.default,
        unstyled: false,
        classNames: {
          toaster: 'app-toaster-host',
          toast: 'app-toast',
          title: 'app-toast-title',
          description: 'app-toast-description',
          actionButton: 'app-toast-action',
          cancelButton: 'app-toast-cancel',
          closeButton: 'app-toast-close',
          icon: 'app-toast-icon',
        },
      }}
    />
  )
}
