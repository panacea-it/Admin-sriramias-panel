import { useEffect, useState } from 'react'
import { Download, Mail, MessageCircle, MessageSquare, Printer, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import CompletionReceiptDocument from './CompletionReceiptDocument'
import { cn } from '../../../utils/cn'
import Modal from '../../ui/Modal'

const CHANNELS = [
  { id: 'WhatsApp', icon: MessageCircle, color: 'border-[#25D366] text-[#128C7E]', key: 'whatsapp' },
  { id: 'SMS', icon: MessageSquare, color: 'border-[#246392] text-[#246392]', key: 'sms' },
  { id: 'Email', icon: Mail, color: 'border-indigo-300 text-indigo-700', key: 'email' },
]

export default function SendReceiptDialog({
  open,
  row,
  previewRow = null,
  gstSettings = null,
  emailDefaults = null,
  channelsEnabled = { whatsapp: false, sms: false, email: true },
  onClose,
  onSend,
  onPrint,
  onDownload,
  sending = false,
  previewLoading = false,
}) {
  const [channel, setChannel] = useState('WhatsApp')

  const { register, handleSubmit, reset, setValue } = useForm({
    defaultValues: {
      mobile: '',
      email: '',
      subject: '',
      message: '',
    },
  })

  useEffect(() => {
    if (!open || !row) return
    reset({
      mobile: row.mobile || '',
      email: emailDefaults?.email || row.email || '',
      subject: emailDefaults?.subject || '',
      message: emailDefaults?.message || '',
    })
    setChannel('WhatsApp')
  }, [open, row, emailDefaults, reset])

  useEffect(() => {
    if (!open || channel !== 'Email' || !emailDefaults) return
    setValue('email', emailDefaults.email || row?.email || '')
    setValue('subject', emailDefaults.subject || '')
    setValue('message', emailDefaults.message || '')
  }, [channel, emailDefaults, open, row, setValue])

  const activeChannel = CHANNELS.find((c) => c.id === channel)
  const channelKey = activeChannel?.key || 'email'
  const isChannelEnabled = channelsEnabled[channelKey] !== false

  const onSubmit = async (data) => {
    await onSend?.({
      channel,
      mobile: data.mobile,
      email: data.email,
      subject: data.subject,
      message: data.message,
    })
  }

  if (!open || !row) return null

  const displayRow = previewRow || row

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Send receipt">
      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-[#f8fbff] to-white px-5 py-4 pr-14">
          <div>
            <h2 className="text-lg font-bold text-[#111]">Send receipt</h2>
            <p className="text-sm text-[#686868]">
              {row.studentName} · {row.receiptNumber}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row"
        >
          <div className="min-h-0 flex-1 overflow-y-auto border-b border-slate-100 bg-slate-50/50 p-4 lg:border-b-0 lg:border-r">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#246392]">
              Receipt preview
            </p>
            {previewLoading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-[#686868]">
                Loading preview…
              </div>
            ) : (
              <div className="origin-top scale-[0.92] sm:scale-100">
                <CompletionReceiptDocument row={displayRow} gstSettings={gstSettings} compact />
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-2 print:hidden">
              <button
                type="button"
                onClick={() => onPrint?.(row)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#444] hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
              <button
                type="button"
                onClick={() => onDownload?.(row)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#444] hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </button>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col lg:w-[340px]">
            <div className="space-y-4 overflow-y-auto p-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase text-[#555]">Send via</p>
                <div className="grid grid-cols-3 gap-2">
                  {CHANNELS.map(({ id, icon: Icon, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setChannel(id)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-2.5 text-xs font-semibold transition',
                        channel === id
                          ? color + ' bg-white shadow-sm'
                          : 'border-slate-200 text-[#686868] hover:border-slate-300',
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {id}
                    </button>
                  ))}
                </div>
              </div>

              {(channel === 'WhatsApp' || channel === 'SMS') && (
                <label className="block text-xs font-semibold text-[#333]">
                  Mobile number
                  <input
                    {...register('mobile', { required: isChannelEnabled })}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                  />
                </label>
              )}

              {channel === 'Email' && (
                <>
                  <label className="block text-xs font-semibold text-[#333]">
                    Email ID
                    <input
                      type="email"
                      {...register('email', { required: isChannelEnabled })}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-[#333]">
                    Subject
                    <input
                      {...register('subject')}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                    />
                  </label>
                </>
              )}

              <label className="block text-xs font-semibold text-[#333]">
                Message
                <textarea
                  {...register('message')}
                  rows={5}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </label>

              {channel === 'WhatsApp' && (
                <p className="rounded-lg bg-[#dcf8e8] px-3 py-2 text-[11px] text-[#128C7E]">
                  {isChannelEnabled
                    ? 'Receipt PDF will be attached automatically when WhatsApp is connected to the backend.'
                    : 'Coming Soon — WhatsApp sending is not yet available.'}
                </p>
              )}
              {channel === 'SMS' && !isChannelEnabled && (
                <p className="rounded-lg bg-slate-100 px-3 py-2 text-[11px] text-[#686868]">
                  Coming Soon — SMS sending is not yet available.
                </p>
              )}
            </div>

            <div className="mt-auto flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/80 p-4">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-[#444]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending || !isChannelEnabled}
                title={!isChannelEnabled ? 'Coming Soon' : undefined}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-gradient-to-r from-[#246392] to-[#1a4d73] px-5 text-sm font-bold text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Sending…' : 'Send Receipt'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  )
}
