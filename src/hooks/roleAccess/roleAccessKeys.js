export const roleAccessKeys = {
  all: ['roleAccess'],
  lists: () => [...roleAccessKeys.all, 'list'],
  list: (params) => [...roleAccessKeys.lists(), params],
  details: () => [...roleAccessKeys.all, 'detail'],
  detail: (id) => [...roleAccessKeys.details(), id],
  dropdown: () => [...roleAccessKeys.all, 'dropdown'],
  permissionModules: () => [...roleAccessKeys.all, 'permissionModules'],
  permissionMatrix: (roleId) => [...roleAccessKeys.all, 'permissionMatrix', roleId],
  permissionMatrixAll: (params) => [...roleAccessKeys.all, 'permissionMatrixAll', params],
}
