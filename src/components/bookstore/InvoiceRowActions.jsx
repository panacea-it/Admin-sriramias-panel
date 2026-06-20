import { Download } from 'lucide-react'
import ViewButton from '../common/ViewButton'
import IconActionButton from '../common/IconActionButton'
import { TABLE_ACTIONS_WRAP_CENTER } from '../../utils/tableColumnHelpers'

export default function InvoiceRowActions({ invoiceId, onPreview, onDownload }) {
  return (
    <div className={TABLE_ACTIONS_WRAP_CENTER}>
      <ViewButton
        onClick={onPreview}
        label={`Preview invoice ${invoiceId}`}
      />
      <IconActionButton
        label={`Download invoice ${invoiceId}`}
        onClick={onDownload}
        className="text-[#555] hover:border-slate-200 hover:bg-slate-100 hover:text-[#246392] hover:shadow-sm"
      >
        <Download className="h-[18px] w-[18px]" strokeWidth={2.25} aria-hidden />
      </IconActionButton>
    </div>
  )
}
