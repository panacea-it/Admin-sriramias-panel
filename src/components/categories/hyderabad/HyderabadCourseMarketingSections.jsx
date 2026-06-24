import BatchFormSection from '../../courses/BatchFormSection'
import EditableSectionTitleField from '../../courses/EditableSectionTitleField'
import WhyChooseFeaturesSection from '../../courses/WhyChooseFeaturesSection'
import { CourseTextarea } from '../../courses/CourseFormField'
import HelpSectionMediaUpload, { revokeBlobUrl } from '../HelpSectionMediaUpload'
import DynamicPointsList from '../newDelhi/DynamicPointsList'
import {
  buildDefaultSectionTitles,
  DEFAULT_SECTION_TITLE_OVERVIEW,
  DEFAULT_WHY_CHOOSE_TITLE,
  resolveWhyChooseTitle,
} from '../../../utils/academicCourseForm'
import {
  keyFeaturePointsFromSlots,
  syncKeyFeatureSlots,
} from '../../../utils/newDelhiCourseUi'
import {
  createEmptyHyderabadUi,
  DEFAULT_SECTION_TITLE_HOW_HELPS_HYDERABAD,
  DEFAULT_SECTION_TITLE_KEY_HIGHLIGHTS_HYDERABAD,
  resolveHyderabadUi,
} from '../../../utils/hyderabadCourseUi'

function updateMediaSlot(current = {}, payload = {}) {
  if (payload.preview && current.preview && current.preview !== payload.preview) {
    revokeBlobUrl(current.preview)
  }
  return { ...current, ...payload }
}

export default function HyderabadCourseMarketingSections({
  form,
  setForm,
  courseName = '',
}) {
  const displayWhyTitle = resolveWhyChooseTitle(form)
  const hyderabadUi = resolveHyderabadUi(form)
  const sectionDefaults = buildDefaultSectionTitles({
    courseName: courseName || form.name,
  })

  const setSectionTitle = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const patchHyderabadUi = (patch) => {
    setForm((f) => ({
      ...f,
      hyderabadUi: {
        ...createEmptyHyderabadUi(),
        ...(f.hyderabadUi || {}),
        ...patch,
      },
    }))
  }

  const keyFeatureImage = form.keyFeatures?.[0] || {
    id: 'kf-0',
    fileName: '',
    preview: '',
    file: null,
  }

  const keyFeaturePoints = keyFeaturePointsFromSlots(form.keyFeatures)

  const updateKeyFeaturePoints = (points) => {
    setForm((f) => ({
      ...f,
      keyFeatures: syncKeyFeatureSlots(f.keyFeatures, points),
    }))
  }

  const updateKeyFeatureImage = (payload) => {
    setForm((f) => {
      const next = [...(f.keyFeatures || [])]
      const current = next[0] || { id: 'kf-0', fileName: '', text: '' }
      next[0] = updateMediaSlot(current, payload)
      return { ...f, keyFeatures: next }
    })
  }

  const clearKeyFeatureImage = () => {
    setForm((f) => {
      const next = [...(f.keyFeatures || [])]
      const current = next[0] || { id: 'kf-0', fileName: '', text: '' }
      revokeBlobUrl(current.preview)
      next[0] = { ...current, file: null, fileName: '', preview: '' }
      return { ...f, keyFeatures: next }
    })
  }

  const updateWhyChooseMedia = (key, payload) => {
    setForm((f) => {
      const ui = resolveHyderabadUi(f)
      const current = ui.whyChooseMedia[key] || {}
      return {
        ...f,
        hyderabadUi: {
          ...createEmptyHyderabadUi(),
          ...(f.hyderabadUi || {}),
          whyChooseMedia: {
            ...ui.whyChooseMedia,
            [key]: updateMediaSlot(current, payload),
          },
        },
      }
    })
  }

  const clearWhyChooseMedia = (key) => {
    setForm((f) => {
      const ui = resolveHyderabadUi(f)
      const current = ui.whyChooseMedia[key] || {}
      revokeBlobUrl(current.preview)
      return {
        ...f,
        hyderabadUi: {
          ...createEmptyHyderabadUi(),
          ...(f.hyderabadUi || {}),
          whyChooseMedia: {
            ...ui.whyChooseMedia,
            [key]: { fileName: '', preview: '', file: null },
          },
        },
      }
    })
  }

  const updateHowHelpsMedia = (key, payload) => {
    setForm((f) => {
      const ui = resolveHyderabadUi(f)
      const current = ui.howHelpsMedia[key] || {}
      return {
        ...f,
        hyderabadUi: {
          ...createEmptyHyderabadUi(),
          ...(f.hyderabadUi || {}),
          howHelpsMedia: {
            ...ui.howHelpsMedia,
            [key]: updateMediaSlot(current, payload),
          },
        },
      }
    })
  }

  const clearHowHelpsMedia = (key) => {
    setForm((f) => {
      const ui = resolveHyderabadUi(f)
      const current = ui.howHelpsMedia[key] || {}
      revokeBlobUrl(current.preview)
      return {
        ...f,
        hyderabadUi: {
          ...createEmptyHyderabadUi(),
          ...(f.hyderabadUi || {}),
          howHelpsMedia: {
            ...ui.howHelpsMedia,
            [key]: { fileName: '', preview: '', file: null },
          },
        },
      }
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <EditableSectionTitleField
          sectionHeader="Course Overview"
          fieldLabel="Course Overview Section Title"
          value={form.sectionTitleOverview ?? ''}
          defaultDisplayValue={DEFAULT_SECTION_TITLE_OVERVIEW}
          onChange={setSectionTitle('sectionTitleOverview')}
          placeholder={DEFAULT_SECTION_TITLE_OVERVIEW}
          aria-label="Course Overview section title"
        />
        <BatchFormSection>
          <CourseTextarea
            value={form.overview ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))}
            rows={10}
            placeholder=""
          />
        </BatchFormSection>
      </div>

      <div className="space-y-6">
        <EditableSectionTitleField
          sectionHeader="Key Highlights Of Course"
          fieldLabel="Key Highlights Section Title"
          value={form.sectionTitleKeyFeatures ?? ''}
          defaultDisplayValue={DEFAULT_SECTION_TITLE_KEY_HIGHLIGHTS_HYDERABAD}
          onChange={setSectionTitle('sectionTitleKeyFeatures')}
          placeholder={DEFAULT_SECTION_TITLE_KEY_HIGHLIGHTS_HYDERABAD}
          aria-label="Key Highlights section title"
        />
        <BatchFormSection className="space-y-6">
          <HelpSectionMediaUpload
            variant="image"
            label="Section Image"
            fileName={keyFeatureImage.fileName}
            preview={keyFeatureImage.preview}
            onSelect={updateKeyFeatureImage}
            onRemove={clearKeyFeatureImage}
          />
          <DynamicPointsList
            label="Points"
            points={keyFeaturePoints}
            onChange={updateKeyFeaturePoints}
            addLabel="+ Add Point"
            showReorder
          />
        </BatchFormSection>
      </div>

      <div className="space-y-6">
        <EditableSectionTitleField
          sectionHeader="Why Choose This Course"
          fieldLabel="Why Choose Section Title"
          value={form.whyChooseTitle ?? ''}
          defaultDisplayValue={displayWhyTitle}
          onChange={(value) => setForm((f) => ({ ...f, whyChooseTitle: value }))}
          placeholder={DEFAULT_WHY_CHOOSE_TITLE}
          aria-label="Why Choose section title"
        />

        <BatchFormSection className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <HelpSectionMediaUpload
              variant="image"
              label="Upload Image 1"
              fileName={hyderabadUi.whyChooseMedia.image1?.fileName}
              preview={hyderabadUi.whyChooseMedia.image1?.preview}
              onSelect={(payload) => updateWhyChooseMedia('image1', payload)}
              onRemove={() => clearWhyChooseMedia('image1')}
            />
            <HelpSectionMediaUpload
              variant="image"
              label="Upload Image 2"
              fileName={hyderabadUi.whyChooseMedia.image2?.fileName}
              preview={hyderabadUi.whyChooseMedia.image2?.preview}
              onSelect={(payload) => updateWhyChooseMedia('image2', payload)}
              onRemove={() => clearWhyChooseMedia('image2')}
            />
            <HelpSectionMediaUpload
              variant="video"
              label="Upload Video"
              fileName={hyderabadUi.whyChooseMedia.video?.fileName}
              preview={hyderabadUi.whyChooseMedia.video?.preview}
              onSelect={(payload) => updateWhyChooseMedia('video', payload)}
              onRemove={() => clearWhyChooseMedia('video')}
            />
          </div>
        </BatchFormSection>

        <BatchFormSection>
          <WhyChooseFeaturesSection
            features={form.whyChooseFeatures}
            onChange={(whyChooseFeatures) => setForm((f) => ({ ...f, whyChooseFeatures }))}
          />
        </BatchFormSection>
      </div>

      <div className="space-y-6">
        <EditableSectionTitleField
          sectionHeader="How Will This Course Help You"
          fieldLabel="How Will Section Title"
          value={form.sectionTitleHowHelps ?? ''}
          defaultDisplayValue={DEFAULT_SECTION_TITLE_HOW_HELPS_HYDERABAD}
          onChange={setSectionTitle('sectionTitleHowHelps')}
          placeholder={sectionDefaults.sectionTitleHowHelps}
          aria-label="How Will section title"
        />
        <BatchFormSection className="space-y-6">
          <DynamicPointsList
            label="Points"
            points={hyderabadUi.howHelpsPoints}
            onChange={(points) => patchHyderabadUi({ howHelpsPoints: points })}
            addLabel="+ Add Point"
            showReorder={false}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <HelpSectionMediaUpload
              variant="video"
              label="Upload Video"
              fileName={hyderabadUi.howHelpsMedia.video?.fileName}
              preview={hyderabadUi.howHelpsMedia.video?.preview}
              onSelect={(payload) => updateHowHelpsMedia('video', payload)}
              onRemove={() => clearHowHelpsMedia('video')}
            />
            <HelpSectionMediaUpload
              variant="image"
              label="Upload Image"
              fileName={hyderabadUi.howHelpsMedia.image?.fileName}
              preview={hyderabadUi.howHelpsMedia.image?.preview}
              onSelect={(payload) => updateHowHelpsMedia('image', payload)}
              onRemove={() => clearHowHelpsMedia('image')}
            />
          </div>
        </BatchFormSection>
      </div>
    </div>
  )
}
