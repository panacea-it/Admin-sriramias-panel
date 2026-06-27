import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import BatchFormSection from '../courses/BatchFormSection'
import HelpSectionMediaUpload, { revokeBlobUrl } from './HelpSectionMediaUpload'
import { cn } from '../../utils/cn'

function createEmptyBlockSlots() {
  const ts = Date.now()
  return [
    {
      id: `hw-${ts}-v`,
      kind: 'video',
      fileName: '',
      file: null,
      preview: '',
    },
    {
      id: `hw-${ts}-i1`,
      kind: 'image',
      fileName: '',
      file: null,
      preview: '',
    },
    {
      id: `hw-${ts}-i2`,
      kind: 'image',
      fileName: '',
      file: null,
      preview: '',
    },
  ]
}

function groupHowWillIntoBlocks(howWill = []) {
  const blocks = []
  for (let i = 0; i < howWill.length; i += 3) {
    blocks.push({
      startIndex: i,
      video: howWill[i] || { kind: 'video', fileName: '', file: null, preview: '' },
      image1: howWill[i + 1] || { kind: 'image', fileName: '', file: null, preview: '' },
      image2: howWill[i + 2] || { kind: 'image', fileName: '', file: null, preview: '' },
    })
  }
  return blocks
}

function HelpSectionCard({ index, block, onUpdateSlot, onRequestRemove }) {
  const { startIndex, video, image1, image2 } = block

  const updateAt = (offset, patch) => onUpdateSlot(startIndex + offset, patch)

  const clearSlot = (offset, slot) => {
    revokeBlobUrl(slot?.preview)
    updateAt(offset, { file: null, fileName: '', preview: '' })
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-[#fafcff] px-4 py-3 sm:px-5">
        <h4 className="text-sm font-bold text-[#246392] sm:text-base">
          Help Section #{index + 1}
        </h4>
        <button
          type="button"
          onClick={onRequestRemove}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Remove Section
        </button>
      </header>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3">
        <HelpSectionMediaUpload
          variant="video"
          label="Upload Help Section Video"
          fileName={video.fileName}
          preview={video.preview}
          onSelect={(payload) => updateAt(0, payload)}
          onRemove={() => clearSlot(0, video)}
        />
        <HelpSectionMediaUpload
          variant="image"
          label="Upload Supporting Image"
          sublabel="Image 1"
          fileName={image1.fileName}
          preview={image1.preview}
          onSelect={(payload) => updateAt(1, payload)}
          onRemove={() => clearSlot(1, image1)}
        />
        <HelpSectionMediaUpload
          variant="image"
          label="Upload Supporting Image"
          sublabel="Image 2"
          fileName={image2.fileName}
          preview={image2.preview}
          onSelect={(payload) => updateAt(2, payload)}
          onRemove={() => clearSlot(2, image2)}
        />
      </div>
    </article>
  )
}

export default function HelpSectionCardsSection({ howWill = [], setForm }) {
  const [deleteTarget, setDeleteTarget] = useState(null)

  const displayBlocks = useMemo(() => groupHowWillIntoBlocks(howWill), [howWill])

  const updateSlot = (index, patch) => {
    setForm((f) => {
      const next = [...(f.howWill || [])]
      while (next.length <= index) {
        const offset = next.length % 3
        next.push({
          id: `hw-${Date.now()}-${next.length}`,
          kind: offset === 0 ? 'video' : 'image',
          fileName: '',
          file: null,
          preview: '',
        })
      }
      if (patch.preview && next[index].preview && next[index].preview !== patch.preview) {
        revokeBlobUrl(next[index].preview)
      }
      next[index] = { ...next[index], ...patch }
      return { ...f, howWill: next }
    })
  }

  const handleAddBlock = () => {
    setForm((f) => ({
      ...f,
      howWill: [...(f.howWill || []), ...createEmptyBlockSlots()],
    }))
  }

  const handleConfirmRemove = () => {
    if (deleteTarget == null) return
    const startIndex = deleteTarget
    setForm((f) => {
      const next = [...(f.howWill || [])]
      for (let i = 0; i < 3; i++) {
        revokeBlobUrl(next[startIndex + i]?.preview)
      }
      next.splice(startIndex, 3)
      return { ...f, howWill: next }
    })
    setDeleteTarget(null)
  }

  return (
    <BatchFormSection className="space-y-6">
      <div className="space-y-5">
        {displayBlocks.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-[#fafcff] px-5 py-10 text-center">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#eef6fc]">
              <Plus className="h-6 w-6 text-[#55ace7]" aria-hidden />
            </span>
            <p className="text-sm font-semibold text-[#246392]">Upload video and supporting images</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
              Add a help section to showcase how this course supports students.
            </p>
          </div>
        ) : (
          displayBlocks.map((block, idx) => (
            <HelpSectionCard
              key={
                block.video?.id ||
                `help-block-${block.startIndex}-${block.image1?.id || ''}-${block.image2?.id || ''}`
              }
              index={idx}
              block={block}
              onUpdateSlot={updateSlot}
              onRequestRemove={() => setDeleteTarget(block.startIndex)}
            />
          ))
        )}
      </div>

      <div className="flex justify-center border-t border-gray-100 pt-6">
        <button
          type="button"
          onClick={handleAddBlock}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl border border-[#55ace7]/30 bg-[#eef6fc] px-6 py-2.5 text-sm font-semibold text-[#246392] shadow-sm transition',
            'hover:border-[#55ace7] hover:bg-white hover:shadow-md active:scale-[0.98]',
          )}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Add Help Section
        </button>
      </div>

      
    </BatchFormSection>
  )
}
