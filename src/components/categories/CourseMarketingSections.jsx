import BatchFormSection from '../courses/BatchFormSection'
import EditableSectionTitleField from '../courses/EditableSectionTitleField'
import WhyChooseFeaturesSection from '../courses/WhyChooseFeaturesSection'
import HelpSectionCardsSection from './HelpSectionCardsSection'
import NewDelhiCourseMarketingSections from './newDelhi/NewDelhiCourseMarketingSections'
import HyderabadCourseMarketingSections from './hyderabad/HyderabadCourseMarketingSections'
import PuneCourseMarketingSections from './pune/PuneCourseMarketingSections'
import { isNewDelhiCenter } from '../../utils/newDelhiCourseUi'
import { isHyderabadCenter } from '../../utils/hyderabadCourseUi'
import { isPuneCenter } from '../../utils/puneCourseUi'
import {
  CourseAddMoreLink,
  CourseFormField,
  CourseInput,
  CourseMediaSlot,
  CourseTextarea,
} from '../courses/CourseFormField'
import {
  buildDefaultSectionTitles,
  buildHowHelpsTitle,
  DEFAULT_SECTION_TITLE_KEY_FEATURES,
  DEFAULT_SECTION_TITLE_OVERVIEW,
  DEFAULT_WHY_CHOOSE_SUBTITLE,
  DEFAULT_WHY_CHOOSE_TITLE,
  resolveWhyChooseSubtitle,
  resolveWhyChooseTitle,
} from '../../utils/academicCourseForm'

const batchGrid = 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3'

const makeSlots = (count, factory) => Array.from({ length: count }, (_, i) => factory(i))

function appendGridRow(setForm, key, factory) {
  setForm((f) => ({
    ...f,
    [key]: [...(f[key] || []), ...makeSlots(3, (i) => factory((f[key] || []).length + i))],
  }))
}

/**
 * Course marketing sections — Add/Edit Course dialog with editable section headings.
 */
export default function CourseMarketingSections({
  form,
  setForm,
  courseName = '',
  centerLabel = '',
}) {
  if (isNewDelhiCenter(centerLabel)) {
    return (
      <NewDelhiCourseMarketingSections
        form={form}
        setForm={setForm}
        courseName={courseName}
      />
    )
  }

  if (isHyderabadCenter(centerLabel)) {
    return (
      <HyderabadCourseMarketingSections
        form={form}
        setForm={setForm}
        courseName={courseName}
      />
    )
  }

  if (isPuneCenter(centerLabel)) {
    return (
      <PuneCourseMarketingSections
        form={form}
        setForm={setForm}
        courseName={courseName}
      />
    )
  }

  const defaultHowTitle = buildHowHelpsTitle(courseName || form.name)
  const displayWhyTitle = resolveWhyChooseTitle(form)
  const displayWhySubtitle = resolveWhyChooseSubtitle(form)

  const setSectionTitle = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }))
  }

  const updateOverview = (e) => {
    setForm((f) => ({ ...f, overview: e.target.value }))
  }

  const keyFeatures = form.keyFeatures?.length ? form.keyFeatures : []
  const sectionDefaults = buildDefaultSectionTitles({
    courseName: courseName || form.name,
  })

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
            onChange={updateOverview}
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
          <div className={batchGrid}>
            {keyFeatures.map((slot, idx) =>
              idx === 0 ? (
                <CourseMediaSlot
                  key={slot.id || `kf-${idx}`}
                  placeholder="Image to be displayed"
                  fileName={slot.fileName}
                  onFileChange={(e) => {
                    const file = e.target.files?.[0]
                    setForm((f) => {
                      const next = [...f.keyFeatures]
                      next[0] = {
                        ...next[0],
                        fileName: file?.name || '',
                        file: file || null,
                      }
                      return { ...f, keyFeatures: next }
                    })
                  }}
                />
              ) : (
                <CourseInput
                  key={slot.id || `kf-${idx}`}
                  value={slot.text || ''}
                  onChange={(e) => {
                    const text = e.target.value
                    setForm((f) => {
                      const next = [...f.keyFeatures]
                      next[idx] = { ...next[idx], text }
                      return { ...f, keyFeatures: next }
                    })
                  }}
                  placeholder=""
                />
              ),
            )}
          </div>
          <div className="flex justify-end border-t border-gray-100 pt-5">
            <CourseAddMoreLink
              variant="pill"
              onClick={() =>
                appendGridRow(setForm, 'keyFeatures', (i) => ({
                  id: `kf-${Date.now()}-${i}`,
                  fileName: '',
                  text: '',
                }))
              }
            />
          </div>
        </BatchFormSection>
      </div>

      <div className="space-y-6">
        <EditableSectionTitleField
          sectionHeader="Why Choose This Course"
          fieldLabel="Why Choose Section Title"
          value={form.whyChooseTitle ?? ''}
          defaultDisplayValue={DEFAULT_WHY_CHOOSE_TITLE}
          onChange={(value) => setForm((f) => ({ ...f, whyChooseTitle: value }))}
          placeholder={DEFAULT_WHY_CHOOSE_TITLE}
          previewSubtitle={displayWhySubtitle}
          aria-label="Why Choose section title"
        />

        <BatchFormSection className="space-y-5">
          <CourseFormField label="Why Choose Section Subtitle">
            <CourseTextarea
              value={form.whyChooseSubtitle ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, whyChooseSubtitle: e.target.value }))
              }
              rows={3}
              placeholder={DEFAULT_WHY_CHOOSE_SUBTITLE}
            />
          </CourseFormField>
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
        <HelpSectionCardsSection howWill={form.howWill || []} setForm={setForm} />
      </div>
    </div>
  )
}
