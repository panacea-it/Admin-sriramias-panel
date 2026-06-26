export const adminKeys = {
  all: ['admins'],
  lists: () => [...adminKeys.all, 'list'],
  list: (params) => [...adminKeys.lists(), params],
  details: () => [...adminKeys.all, 'detail'],
  detail: (id) => [...adminKeys.details(), id],
  rolesDropdown: () => ['admin-roles', 'dropdown'],
  centersDropdown: () => ['admin-centers', 'dropdown'],
  mentorsDropdown: (params) => ['admin-mentors', 'dropdown', params],
  myPermissions: () => ['admin-permissions', 'my-access'],
  rolePermissions: (roleId) => ['admin-permissions', 'role', roleId],
}
