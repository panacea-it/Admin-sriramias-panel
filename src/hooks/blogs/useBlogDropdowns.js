import { useQuery } from '@tanstack/react-query'
import {
  fetchBlogCategoriesDropdown,
  fetchBlogDropdowns,
  fetchBlogLanguagesDropdown,
  fetchBlogReadTimeDropdown,
} from '../../api/blogAPI'
import { buildBlogLanguageLookup } from '../../utils/blogApiHelpers'

export const blogDropdownKeys = {
  all: ['blog-dropdowns'],
  bundle: ['blog-dropdowns', 'bundle'],
  languages: ['blog-dropdowns', 'languages'],
  categories: ['blog-dropdowns', 'categories'],
  readTimes: ['blog-dropdowns', 'read-times'],
}

export function useBlogDropdowns(options = {}) {
  const { enabled = true, ...queryOptions } = options

  return useQuery({
    queryKey: blogDropdownKeys.bundle,
    queryFn: fetchBlogDropdowns,
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    ...queryOptions,
  })
}

export function useBlogLanguageLookup(options = {}) {
  const query = useBlogDropdowns(options)

  return {
    ...query,
    languageLookup: buildBlogLanguageLookup(query.data?.languages ?? []),
    languages: query.data?.languages ?? [],
  }
}

export function useBlogLanguagesDropdown(options = {}) {
  return useQuery({
    queryKey: blogDropdownKeys.languages,
    queryFn: fetchBlogLanguagesDropdown,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    ...options,
  })
}

export function useBlogCategoriesDropdown(options = {}) {
  return useQuery({
    queryKey: blogDropdownKeys.categories,
    queryFn: fetchBlogCategoriesDropdown,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    ...options,
  })
}

export function useBlogReadTimeDropdown(options = {}) {
  return useQuery({
    queryKey: blogDropdownKeys.readTimes,
    queryFn: fetchBlogReadTimeDropdown,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    ...options,
  })
}
