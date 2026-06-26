export const centerKeys = {
  all: ['centers'],
  lists: () => [...centerKeys.all, 'list'],
  list: (params) => [...centerKeys.lists(), params ?? {}],
  details: () => [...centerKeys.all, 'detail'],
  detail: (id) => [...centerKeys.details(), id],
  dropdown: () => [...centerKeys.all, 'dropdown'],
  states: () => [...centerKeys.all, 'states'],
}
