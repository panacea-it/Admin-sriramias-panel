import BatchFormSection from '../../courses/BatchFormSection'
import EditableSectionTitleField from '../../courses/EditableSectionTitleField'
import WhyChooseFeaturesSection from '../../courses/WhyChooseFeaturesSection'
import { CourseTextarea } from '../../courses/CourseFormField'
import HelpSectionMediaUpload, { revokeBlobUrl } from '../HelpSectionMediaUpload'
import DynamicPointsList from './DynamicPointsList'
import NewDelhiHelpSectionCardsSection from './NewDelhiHelpSectionCardsSection'
import {
  buildDefaultSectionTitles,
  buildHowHelpsTitle,
  DEFAULT_SECTION_TITLE_KEY_FEATURES,
  DEFAULT_SECTION_TITLE_OVERVIEW,
  DEFAULT_WHY_CHOOSE_TITLE,
  resolveWhyChooseTitle,
} from '../../../utils/academicCourseForm'
import {
  createEmptyNewDelhiUi,
  keyFeaturePointsFromSlots,
  resolveNewDelhiUi,
  syncKeyFeatureSlots,
} from '../../../utils/newDelhiCourseUi'

export default function NewDelhiCourseMarketingSections({
  form,
  setForm,
  courseName = '',
}) {
  const defaultHowTitle = buildHowHelpsTitle(courseName || form.name)
  const displayWhyTitle = resolveWhyChooseTitle(form)
  const newDelhiUi = resolveNewDelhiUi(form)
  const sectionDefaults = buildDefaultSectionTitles({
    courseName: courseName || form.name,
  })

  const setSectionTitle = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const ensureNewDelhiUi = (patch) => {
    setForm((f) => ({
      ...f,
      newDelhiUi: {
        ...createEmptyNewDelhiUi(),
        ...(f.newDelhiUi || {}),
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
      if (payload.preview && current.preview && current.preview !== payload.preview) {
        revokeBlobUrl(current.preview)
      }
      next[0] = { ...current, ...payload }
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
      const current = f.newDelhiUi?.whyChooseImage || {}
      if (payload.preview && current.preview && current.preview !== payload.preview) {
        revokeBlobUrl(current.preview)
      }
      return {
        ...f,
        newDelhiUi: {
          ...createEmptyNewDelhiUi(),
          ...(f.newDelhiUi || {}),
          whyChooseImage: { ...current, ...payload },
        },
      }
    })
  }

  const clearWhyChooseImage = () => {
    setForm((f) => {
      const current = f.newDelhiUi?.whyChooseImage || {}
      revokeBlobUrl(current.preview)
      return {
        ...f,
        newDelhiUi: {
          ...createEmptyNewDelhiUi(),
          ...(f.newDelhiUi || {}),
          whyChooseImage: { fileName: '', preview: '', file: null },
        },
      }
    })
  }

  const updateHowHelpsPoints = (points) => {
    ensureNewDelhiUi({ howHelpsPoints: points })
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
          sectionHeader="Key Features Of Course"
          fieldLabel="Key Features Section Title"
          value={form.sectionTitleKeyFeatures ?? ''}
          defaultDisplayValue={DEFAULT_SECTION_TITLE_KEY_FEATURES}
          onChange={setSectionTitle('sectionTitleKeyFeatures')}
          placeholder={DEFAULT_SECTION_TITLE_KEY_FEATURES}
          aria-label="Key Features section title"
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
            fileName={newDelhiUi.whyChooseImage?.fileName}
            preview={newDelhiUi.whyChooseImage?.preview}
            onSelect={updateWhyChooseImage}
            onRemove={clearWhyChooseImage}
          />
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
          defaultDisplayValue={defaultHowTitle}
          onChange={setSectionTitle('sectionTitleHowHelps')}
          placeholder={sectionDefaults.sectionTitleHowHelps}
          aria-label="How Will section title"
        />
        <BatchFormSection>
          <DynamicPointsList
            label="Points"
            points={newDelhiUi.howHelpsPoints}
            onChange={updateHowHelpsPoints}
            addLabel="+ Add Point"
            showReorder={false}
          />
        </BatchFormSection>
        <NewDelhiHelpSectionCardsSection
          howWill={form.howWill || []}
          helpSectionExtraImages={newDelhiUi.helpSectionExtraImages}
          setForm={setForm}
        />
      </div>
    </div>
  )
}
