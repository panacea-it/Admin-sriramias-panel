import BatchFormSection from '../../courses/BatchFormSection'
import EditableSectionTitleField from '../../courses/EditableSectionTitleField'
import WhyChooseFeaturesSection from '../../courses/WhyChooseFeaturesSection'
import { CourseTextarea } from '../../courses/CourseFormField'
import HelpSectionMediaUpload, { revokeBlobUrl } from '../HelpSectionMediaUpload'
import DynamicPointsList from '../newDelhi/DynamicPointsList'
import {
  DEFAULT_SECTION_TITLE_OVERVIEW,
  DEFAULT_WHY_CHOOSE_TITLE,
  resolveWhyChooseTitle,
} from '../../../utils/academicCourseForm'
import {
  keyFeaturePointsFromSlots,
  syncKeyFeatureSlots,
} from '../../../utils/newDelhiCourseUi'
import {
  createEmptyPuneUi,
  DEFAULT_SECTION_TITLE_HOW_HELPS_PUNE,
  DEFAULT_SECTION_TITLE_KEY_HIGHLIGHTS_PUNE,
  resolvePuneUi,
} from '../../../utils/puneCourseUi'

function updateMediaSlot(current = {}, payload = {}) {
  if (payload.preview && current.preview && current.preview !== payload.preview) {
    revokeBlobUrl(current.preview)
  }
  return { ...current, ...payload }
}

export default function PuneCourseMarketingSections({
  form,
  setForm,
  courseName = '',
  formResetKey,
}) {
  const displayWhyTitle = resolveWhyChooseTitle(form)
  const puneUi = resolvePuneUi(form)

  const setSectionTitle = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const patchPuneUi = (patch) => {
    setForm((f) => ({
      ...f,
      puneUi: {
        ...createEmptyPuneUi(),
        ...(f.puneUi || {}),
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

  const updateWhyChooseImage = (payload) => {
    setForm((f) => {
      const current = f.puneUi?.whyChooseImage || {}
      return {
        ...f,
        puneUi: {
          ...createEmptyPuneUi(),
          ...(f.puneUi || {}),
          whyChooseImage: updateMediaSlot(current, payload),
        },
      }
    })
  }

  const clearWhyChooseImage = () => {
    setForm((f) => {
      const current = f.puneUi?.whyChooseImage || {}
      revokeBlobUrl(current.preview)
      return {
        ...f,
        puneUi: {
          ...createEmptyPuneUi(),
          ...(f.puneUi || {}),
          whyChooseImage: { fileName: '', preview: '', file: null },
        },
      }
    })
  }

  const updateHowHelpsImage = (payload) => {
    setForm((f) => {
      const current = f.puneUi?.howHelpsImage || {}
      return {
        ...f,
        puneUi: {
          ...createEmptyPuneUi(),
          ...(f.puneUi || {}),
          howHelpsImage: updateMediaSlot(current, payload),
        },
      }
    })
  }

  const clearHowHelpsImage = () => {
    setForm((f) => {
      const current = f.puneUi?.howHelpsImage || {}
      revokeBlobUrl(current.preview)
      return {
        ...f,
        puneUi: {
          ...createEmptyPuneUi(),
          ...(f.puneUi || {}),
          howHelpsImage: { fileName: '', preview: '', file: null },
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
          defaultDisplayValue={DEFAULT_SECTION_TITLE_KEY_HIGHLIGHTS_PUNE}
          onChange={setSectionTitle('sectionTitleKeyFeatures')}
          placeholder={DEFAULT_SECTION_TITLE_KEY_HIGHLIGHTS_PUNE}
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
          <HelpSectionMediaUpload
            variant="image"
            label="Image Upload"
            fileName={puneUi.whyChooseImage?.fileName}
            preview={puneUi.whyChooseImage?.preview}
            onSelect={updateWhyChooseImage}
            onRemove={clearWhyChooseImage}
          />
        </BatchFormSection>

        <BatchFormSection>
          <WhyChooseFeaturesSection
            features={form.whyChooseFeatures}
            onChange={(whyChooseFeatures) => setForm((f) => ({ ...f, whyChooseFeatures }))}
            resetKey={formResetKey}
          />
        </BatchFormSection>
      </div>

      <div className="space-y-6">
        <EditableSectionTitleField
          sectionHeader="How Will This Course Help You"
          fieldLabel="How Will Section Title"
          value={form.sectionTitleHowHelps ?? ''}
          defaultDisplayValue={DEFAULT_SECTION_TITLE_HOW_HELPS_PUNE}
          onChange={setSectionTitle('sectionTitleHowHelps')}
          placeholder={DEFAULT_SECTION_TITLE_HOW_HELPS_PUNE}
          aria-label="How Will section title"
        />
        <BatchFormSection className="space-y-6">
          <DynamicPointsList
            label="Points"
            points={puneUi.howHelpsPoints}
            onChange={(points) => patchPuneUi({ howHelpsPoints: points })}
            addLabel="+ Add Point"
            showReorder={false}
          />
          <HelpSectionMediaUpload
            variant="image"
            label="Upload Image"
            fileName={puneUi.howHelpsImage?.fileName}
            preview={puneUi.howHelpsImage?.preview}
            onSelect={updateHowHelpsImage}
            onRemove={clearHowHelpsImage}
          />
        </BatchFormSection>
      </div>
    </div>
  )
}
