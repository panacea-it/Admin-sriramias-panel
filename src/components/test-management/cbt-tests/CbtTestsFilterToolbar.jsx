import { Search, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cbtDropdownService } from '../../../services/cbtDropdownService'
import { cbtTestKeys } from '../../../hooks/cbtTestKeys'
import { PUBLISH_STATUS_OPTIONS, SORT_OPTIONS, unwrapDropdownItems } from '../../../utils/cbtTestFormHelpers'
import { CourseDateInput } from '../../courses/CourseFormField'

function ToolbarSelect({ label, value, onChange, options, disabled }) {
  return (
    <div className="relative w-full sm:w-auto sm:min-w-[150px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        disabled={disabled}
        className="h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 disabled:opacity-60 sm:text-base"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
    </div>
  )
}

function useFacultySubjectsDropdown() {
  return useQuery({
    queryKey: cbtTestKeys.dropdowns.facultySubjects(''),
    queryFn: () => cbtDropdownService.facultySubjects(),
    staleTime: 5 * 60 * 1000,
  })
}

function useFoldersDropdown(facultySubjectId) {
  return useQuery({
    queryKey: cbtTestKeys.dropdowns.folders(facultySubjectId),
    queryFn: () => cbtDropdownService.folders(facultySubjectId),
    enabled: Boolean(facultySubjectId && facultySubjectId !== 'all'),
    staleTime: 2 * 60 * 1000,
  })
}

function useBatchesDropdown(facultySubjectId) {
  return useQuery({
    queryKey: cbtTestKeys.dropdowns.batches(facultySubjectId),
    queryFn: () => cbtDropdownService.batches(facultySubjectId),
    enabled: Boolean(facultySubjectId && facultySubjectId !== 'all'),
    staleTime: 2 * 60 * 1000,
  })
}

function useLanguagesDropdown() {
  return useQuery({
    queryKey: cbtTestKeys.dropdowns.languages(),
    queryFn: () => cbtDropdownService.languages(),
    staleTime: 10 * 60 * 1000,
  })
}

export default function CbtTestsFilterToolbar({
  search,
  onSearchChange,
  facultySubjectId,
  onFacultySubjectChange,
  folderId,
  onFolderChange,
  batchId,
  onBatchChange,
  language,
  onLanguageChange,
  publishStatus,
  onPublishStatusChange,
  scheduleDateFrom,
  onScheduleDateFromChange,
  scheduleDateTo,
  onScheduleDateToChange,
  sortPreset,
  onSortPresetChange,
  disabled = false,
}) {
  const { data: facultyData } = useFacultySubjectsDropdown()
  const { data: folderData } = useFoldersDropdown(facultySubjectId)
  const { data: batchData } = useBatchesDropdown(facultySubjectId)
  const { data: languageData } = useLanguagesDropdown()

  const facultyOptions = [
    { value: 'all', label: 'All subjects' },
    ...unwrapDropdownItems(facultyData).map((item) => ({
      value: item._id,
      label: item.teacherName
        ? `${item.subjectName} (${item.teacherName})`
        : item.subjectName,
    })),
  ]

  const folderOptions = [
    { value: 'all', label: 'All topics' },
    ...unwrapDropdownItems(folderData).map((item) => ({
      value: item._id,
      label: item.folderName,
    })),
  ]

  const batchOptions = [
    { value: 'all', label: 'All batches' },
    ...unwrapDropdownItems(batchData).map((item) => ({
      value: item._id,
      label: item.batchName,
    })),
  ]

  const languageOptions = [
    { value: 'all', label: 'All languages' },
    ...unwrapDropdownItems(languageData).map((item) => ({
      value: item.languageName,
      label: item.languageName,
    })),
  ]

  const statusOptions = [
    { value: 'all', label: 'All status' },
    ...PUBLISH_STATUS_OPTIONS,
  ]

  const sortOptions = SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
        <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by test name or ID"
            disabled={disabled}
            className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] disabled:opacity-60 sm:pl-11 sm:text-base"
          />
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <ToolbarSelect
            label="Faculty subject"
            value={facultySubjectId}
            onChange={onFacultySubjectChange}
            options={facultyOptions}
            disabled={disabled}
          />
          <ToolbarSelect
            label="Topic"
            value={folderId}
            onChange={onFolderChange}
            options={folderOptions}
            disabled={disabled || facultySubjectId === 'all'}
          />
          <ToolbarSelect
            label="Batch"
            value={batchId}
            onChange={onBatchChange}
            options={batchOptions}
            disabled={disabled || facultySubjectId === 'all'}
          />
          <ToolbarSelect
            label="Language"
            value={language}
            onChange={onLanguageChange}
            options={languageOptions}
            disabled={disabled}
          />
          <ToolbarSelect
            label="Status"
            value={publishStatus}
            onChange={onPublishStatusChange}
            options={statusOptions}
            disabled={disabled}
          />
          <ToolbarSelect
            label="Sort"
            value={sortPreset}
            onChange={onSortPresetChange}
            options={sortOptions}
            disabled={disabled}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule from</span>
          <CourseDateInput
            value={scheduleDateFrom}
            onChange={(e) => onScheduleDateFromChange(e.target.value)}
            disabled={disabled}
            className="w-[160px]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule to</span>
          <CourseDateInput
            value={scheduleDateTo}
            onChange={(e) => onScheduleDateToChange(e.target.value)}
            disabled={disabled}
            className="w-[160px]"
          />
        </div>
      </div>
    </div>
  )
}
