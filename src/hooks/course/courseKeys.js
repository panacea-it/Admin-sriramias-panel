export const courseKeys = {
  all: ['courses'],
  lists: () => [...courseKeys.all, 'list'],
  list: (params) => [...courseKeys.lists(), params],
  details: () => [...courseKeys.all, 'detail'],
  detail: (id) => [...courseKeys.details(), id],
  slug: (slug) => [...courseKeys.all, 'slug', slug],
  dropdown: (params) => [...courseKeys.all, 'dropdown', params],
  enquiry: (params) => [...courseKeys.all, 'enquiry', params],
  grouped: () => [...courseKeys.all, 'grouped'],
}
