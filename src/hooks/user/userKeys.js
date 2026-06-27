export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  list: (params) => [...userKeys.lists(), params],
  details: () => [...userKeys.all, 'detail'],
  detail: (id, type) => [...userKeys.details(), id, type],
  moduleConfig: () => [...userKeys.all, 'module-config'],
  updateFields: (type) => [...userKeys.all, 'update-fields', type],
  roles: () => [...userKeys.all, 'dropdown', 'roles'],
  centers: () => [...userKeys.all, 'dropdown', 'centers'],
  createRoles: () => [...userKeys.all, 'dropdown', 'create-roles'],
  centerForm: () => [...userKeys.all, 'dropdown', 'center-form'],
}
