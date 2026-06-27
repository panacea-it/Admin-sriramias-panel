import SectionBar from '../courses/SectionBar'
import NewDelhiCourseMarketingSections from './newDelhi/NewDelhiCourseMarketingSections'
import HyderabadCourseMarketingSections from './hyderabad/HyderabadCourseMarketingSections'
import PuneCourseMarketingSections from './pune/PuneCourseMarketingSections'
import { isNewDelhiCenter } from '../../utils/newDelhiCourseUi'
import { isHyderabadCenter } from '../../utils/hyderabadCourseUi'
import { isPuneCenter } from '../../utils/puneCourseUi'

const CENTER_SECTIONS = [
  {
    key: 'hyderabad',
    matches: isHyderabadCenter,
    title: 'Hyderabad',
    Component: HyderabadCourseMarketingSections,
  },
  {
    key: 'new-delhi',
    matches: isNewDelhiCenter,
    title: 'New Delhi',
    Component: NewDelhiCourseMarketingSections,
  },
  {
    key: 'pune',
    matches: isPuneCenter,
    title: 'Pune',
    Component: PuneCourseMarketingSections,
  },
]

/**
 * Center-specific course marketing sections — rendered below Course Details
 * when a single centre is selected from the dropdown.
 */
export default function CourseMarketingSections({
  form,
  setForm,
  courseName = '',
  centerLabel = '',
}) {
  if (!centerLabel) return null

  const section = CENTER_SECTIONS.find((entry) => entry.matches(centerLabel))
  if (!section) return null

  const { title, Component } = section

  return (
    <div className="space-y-6">
      <SectionBar title={`${title} — Course Content`} />
      <Component form={form} setForm={setForm} courseName={courseName} />
    </div>
  )
}
