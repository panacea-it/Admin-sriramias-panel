export const questionBankKeys = {
  all: ['questionBank'],
  lists: () => [...questionBankKeys.all, 'list'],
  /** @param {import('../types/questionBank.types').QuestionListFilters} [filters] */
  list: (filters) => [...questionBankKeys.lists(), filters ?? {}],
  details: () => [...questionBankKeys.all, 'detail'],
  detail: (id) => [...questionBankKeys.details(), id ?? ''],
  /** @param {import('../types/questionBank.types').QuestionListFilters} [filters] */
  analytics: (filters) => [...questionBankKeys.all, 'analytics', filters ?? {}],
  types: () => [...questionBankKeys.all, 'types'],
  subjects: () => [...questionBankKeys.all, 'subjects'],
  topics: (subject) => [...questionBankKeys.all, 'topics', subject ?? ''],
  tags: (subject) => [...questionBankKeys.all, 'tags', subject ?? ''],
  difficulties: () => [...questionBankKeys.all, 'difficulties'],
  categories: () => [...questionBankKeys.all, 'categories'],
  editableFields: (type) => [...questionBankKeys.all, 'editableFields', type ?? ''],
}

export default questionBankKeys
