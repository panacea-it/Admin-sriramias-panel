import { useMemo } from 'react'
import BatchFormSection from '../../courses/BatchFormSection'
import HelpSectionMediaUpload, { revokeBlobUrl } from '../HelpSectionMediaUpload'
import { createEmptyHelpSectionExtraImage } from '../../../utils/newDelhiCourseUi'

function groupHowWillIntoBlocks(howWill = [], extraImages = []) {
  const blocks = []
  for (let i = 0; i < howWill.length; i += 3) {
    const blockIndex = blocks.length
    blocks.push({
      startIndex: i,
      video: howWill[i] || { kind: 'video', fileName: '', file: null, preview: '' },
      image1: howWill[i + 1] || { kind: 'image', fileName: '', file: null, preview: '' },
      image2: howWill[i + 2] || { kind: 'image', fileName: '', file: null, preview: '' },
      image3: extraImages[blockIndex] || {
        kind: 'image',
        fileName: '',
        file: null,
        preview: '',
      },
    })
  }
  return blocks
}

function emptyBlock() {
  return {
    startIndex: 0,
    video: { kind: 'video', fileName: '', file: null, preview: '' },
    image1: { kind: 'image', fileName: '', file: null, preview: '' },
    image2: { kind: 'image', fileName: '', file: null, preview: '' },
    image3: { kind: 'image', fileName: '', file: null, preview: '' },
  }
}

function HelpSectionCard({ block, onUpdateSlot, onUpdateExtraImage }) {
  const { startIndex, video, image1, image2, image3 } = block

  const updateAt = (offset, patch) => onUpdateSlot(startIndex + offset, patch)

  const clearSlot = (offset, slot) => {
    revokeBlobUrl(slot?.preview)
    updateAt(offset, { file: null, fileName: '', preview: '' })
  }

  const clearExtraImage = () => {
    revokeBlobUrl(image3?.preview)
    onUpdateExtraImage(0, { file: null, fileName: '', preview: '', file: null })
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm">
      <header className="border-b border-gray-100 bg-[#fafcff] px-5 py-4 sm:px-6">
        <h4 className="text-sm font-bold text-[#246392] sm:text-base">Help Section</h4>
      </header>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2 xl:grid-cols-4">
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
        <HelpSectionMediaUpload
          variant="image"
          label="Upload Supporting Image"
          sublabel="Image 3"
          fileName={image3.fileName}
          preview={image3.preview}
          onSelect={(payload) => onUpdateExtraImage(0, payload)}
          onRemove={clearExtraImage}
        />
      </div>
    </article>
  )
}

export default function NewDelhiHelpSectionCardsSection({
  howWill = [],
  helpSectionExtraImages = [],
  setForm,
}) {
  const displayBlock = useMemo(() => {
    const blocks = groupHowWillIntoBlocks(howWill, helpSectionExtraImages)
    return blocks[0] || emptyBlock()
  }, [howWill, helpSectionExtraImages])

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

  const updateExtraImage = (blockIndex, patch) => {
    setForm((f) => {
      const extras = [...(f.newDelhiUi?.helpSectionExtraImages || [])]
      while (extras.length <= blockIndex) {
        extras.push(createEmptyHelpSectionExtraImage())
      }
      if (
        patch.preview &&
        extras[blockIndex]?.preview &&
        extras[blockIndex].preview !== patch.preview
      ) {
        revokeBlobUrl(extras[blockIndex].preview)
      }
      extras[blockIndex] = { ...extras[blockIndex], ...patch }
      return {
        ...f,
        newDelhiUi: {
          ...(f.newDelhiUi || {}),
          helpSectionExtraImages: extras,
        },
      }
    })
  }

  return (
    <BatchFormSection>
      <HelpSectionCard
        block={displayBlock}
        onUpdateSlot={updateSlot}
        onUpdateExtraImage={updateExtraImage}
      />
    </BatchFormSection>
  )
}
