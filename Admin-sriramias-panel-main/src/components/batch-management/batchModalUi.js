/**
 * Re-export shim so Vite/dev clients that cached `batchModalUi.js` keep resolving
 * after the implementation moved to `batchModalUi.jsx`.
 */
export {
  batchFieldLabel,
  batchInputClass,
  batchInputReadonlyClass,
  batchSelectClass,
  batchTextareaClass,
  BatchField,
  BatchModalFooter,
  BatchCheckboxCard,
  BatchModal,
} from './batchModalUi.jsx'
