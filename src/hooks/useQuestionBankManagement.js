import { useEffect, useMemo, useState } from 'react'
import { toast } from '@/utils/toast'
import { useDebouncedValue } from './useDebouncedValue'
import { useQuestions } from './questionBank/useQuestions'
import { useQuestionStatistics } from './questionBank/useQuestionStatistics'
import { useSubjects } from './questionBank/useSubjects'
import { useTopics } from './questionBank/useTopics'
import { useTags } from './questionBank/useTags'
import { useQuestionTypes } from './questionBank/useQuestionTypes'
import { useDifficultyLevels } from './questionBank/useDifficultyLevels'
import { useQuestionCategories } from './questionBank/useQuestionCategories'
import {
  getQuestionBankErrorMessage,
  resolveQuestionBankSortPreset,
} from '../utils/questionBankApiHelpers'

const DEFAULT_PAGE_SIZE = 10
const DEFAULT_SORT_PRESET = 'createdAt_desc'

export function useQuestionBankManagement() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')
  const [subject, setSubject] = useState('all')
  const [topic, setTopic] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [tag, setTag] = useState('all')
  const [status, setStatus] = useState('all')
  const [sortPreset, setSortPreset] = useState(DEFAULT_SORT_PRESET)

  const debouncedSearch = useDebouncedValue(search, 400)
  const sortConfig = resolveQuestionBankSortPreset(sortPreset)

  const listFilters = useMemo(
    () => ({
      page,
      limit: pageSize,
      search: debouncedSearch.trim(),
      type,
      category,
      subject,
      topic,
      difficulty,
      tags: tag,
      status,
      sortBy: sortConfig.sortBy,
      sortOrder: sortConfig.sortOrder,
    }),
    [
      page,
      pageSize,
      debouncedSearch,
      type,
      category,
      subject,
      topic,
      difficulty,
      tag,
      status,
      sortConfig.sortBy,
      sortConfig.sortOrder,
    ],
  )

  const analyticsFilters = useMemo(
    () => ({
      search: debouncedSearch.trim(),
      type,
      category,
      subject,
      topic,
      difficulty,
      tags: tag,
      status,
    }),
    [debouncedSearch, type, category, subject, topic, difficulty, tag, status],
  )

  const {
    data: listData,
    isLoading,
    isFetching,
    error: listError,
    refetch,
  } = useQuestions(listFilters)

  const { data: analytics, error: analyticsError } = useQuestionStatistics(analyticsFilters)
  const { data: subjectOptions = [] } = useSubjects()
  const { data: topicOptions = [] } = useTopics(subject !== 'all' ? subject : undefined)
  const { data: tagOptions = [] } = useTags(subject !== 'all' ? subject : undefined)
  const { data: typeOptions = [] } = useQuestionTypes()
  const { data: difficultyOptions = [] } = useDifficultyLevels()
  const { data: categoryOptions = [] } = useQuestionCategories()

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, type, category, subject, topic, difficulty, tag, status, sortPreset, pageSize])

  useEffect(() => {
    if (subject === 'all') return
    if (topic !== 'all' && topicOptions.length && !topicOptions.includes(topic)) {
      setTopic('all')
    }
  }, [subject, topic, topicOptions])

  useEffect(() => {
    const err = listError || analyticsError
    if (err) {
      toast.error(getQuestionBankErrorMessage(err, 'Failed to load question bank'))
    }
  }, [listError, analyticsError])

  const rows = listData?.items ?? []
  const totalItems = listData?.total ?? 0
  const totalPages = listData?.totalPages ?? 1
  const tableLoading = isLoading || (isFetching && !listData)

  const pagination = useMemo(() => {
    const safePage = Math.min(Math.max(1, page), totalPages)
    const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)

    return {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
    }
  }, [page, pageSize, totalItems, totalPages])

  const controlledPagination = useMemo(
    () => ({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages,
      startIndex: pagination.startIndex,
      endIndex: pagination.endIndex,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }),
    [pagination],
  )

  return {
    rows,
    analytics,
    tableLoading,
    isFetching,
    search,
    setSearch,
    type,
    setType,
    category,
    setCategory,
    subject,
    setSubject,
    topic,
    setTopic,
    difficulty,
    setDifficulty,
    tag,
    setTag,
    status,
    setStatus,
    sortPreset,
    setSortPreset,
    controlledPagination,
    filterOptions: {
      subjects: subjectOptions,
      topics: topicOptions,
      tags: tagOptions,
      types: typeOptions,
      difficulties: difficultyOptions,
      categories: categoryOptions,
    },
    refreshQuestions: refetch,
  }
}

export default useQuestionBankManagement
