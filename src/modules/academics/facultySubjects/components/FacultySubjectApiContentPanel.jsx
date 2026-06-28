import PrelimsTestsTab from './tabs/PrelimsTestsTab'
import MainsAnswerWritingTab from './tabs/MainsAnswerWritingTab'
import SubjectPdfsTab from './tabs/SubjectPdfsTab'

const API_CATEGORY_TABS = {
  PRELIMS_TEST: PrelimsTestsTab,
  MAINS_ANSWER_WRITING: MainsAnswerWritingTab,
  PDF: SubjectPdfsTab,
}

/**
 * Renders API-backed CMS tab for prelims / mains / PDF categories.
 */
export default function FacultySubjectApiContentPanel({
  apiCategory,
  facultySubjectId,
  folderId,
  folderName,
  canMutate = true,
}) {
  const TabComponent = API_CATEGORY_TABS[apiCategory]
  if (!TabComponent || !facultySubjectId) return null

  return (
    <TabComponent
      facultySubjectId={facultySubjectId}
      folderId={folderId}
      folderName={folderName}
      canMutate={canMutate}
    />
  )
}

export function isApiBackedContentCategory(apiCategory) {
  return Boolean(API_CATEGORY_TABS[apiCategory])
}
